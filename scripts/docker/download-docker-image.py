#!/usr/bin/env python3
import json
import os
import platform
import shutil
import sys

import requests


def get_platform():
    machine = platform.machine().lower()
    if machine in ["amd64", "x86_64"]:
        return "linux", "amd64"
    elif machine in ["aarch64", "xarm64"]:
        return "linux", "arm64"
    return "linux", "amd64"


def download_image(image_name, tag="latest", target_platform=None):
    if "/" not in image_name:
        official_images = ["postgres", "redis", "mysql", "nginx", "ubuntu"]
        if image_name in official_images:
            image_name = f"library/{image_name}"

    registry = "registry-1.docker.io"
    repo = image_name

    if target_platform:
        os_name, arch = target_platform.split("/")
    else:
        os_name, arch = get_platform()

    print(f"Downloading {repo}:{tag} for {os_name}/{arch}...")

    token_url = f"https://auth.docker.io/token?service=registry.docker.io&scope=repository:{repo}:pull"
    try:
        token_response = requests.get(token_url, timeout=30, verify=False)
        token_response.raise_for_status()
        token = token_response.json()["token"]
    except Exception as e:
        print(f"Error getting token: {e}")
        return False

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": ", ".join(
            [
                "application/vnd.docker.distribution.manifest.v2+json",
                "application/vnd.docker.distribution.manifest.list.v2+json",
                "application/vnd.oci.image.manifest.v1+json",
                "application/vnd.oci.image.index.v1+json",
            ]
        ),
    }

    manifest_url = f"https://{registry}/v2/{repo}/manifests/{tag}"
    try:
        manifest_response = requests.get(
            manifest_url, headers=headers, timeout=30, verify=False
        )
        manifest_response.raise_for_status()
        manifest = manifest_response.json()
    except Exception as e:
        print(f"Error getting manifest: {e}")
        return False

    media_type = manifest.get("mediaType", "")
    print(f"Media Type: {media_type}")

    if "index" in media_type or "manifest.list" in media_type:
        print(f"Multi-arch index detected, resolving {os_name}/{arch}...")
        manifests = manifest.get("manifests", [])
        target_manifest = None

        for m in manifests:
            plat = m.get("platform", {})
            if plat.get("os") == os_name and plat.get("architecture") == arch:
                target_manifest = m
                break

        if not target_manifest:
            print(f"Platform {os_name}/{arch} not found")
            return False

        platform_digest = target_manifest["digest"]
        platform_url = f"https://{registry}/v2/{repo}/manifests/{platform_digest}"
        platform_response = requests.get(
            platform_url, headers=headers, timeout=30, verify=False
        )
        platform_response.raise_for_status()
        manifest = platform_response.json()

    # Create images directory for both temporary files AND final TARs
    images_base_dir = "images"
    os.makedirs(images_base_dir, exist_ok=True)

    # Temporary extraction directory inside images/
    temp_dir_name = f"{image_name.replace('/', '_')}_{tag}_{arch}_temp"
    output_dir = os.path.join(images_base_dir, temp_dir_name)
    os.makedirs(output_dir, exist_ok=True)

    config = manifest.get("config", {})
    if config:
        config_digest = config["digest"]
        print(f"Downloading config: {config_digest}")
        blob_url = f"https://{registry}/v2/{repo}/blobs/{config_digest}"
        config_response = requests.get(
            blob_url, headers=headers, stream=True, verify=False
        )
        config_file = os.path.join(output_dir, "config.json")
        with open(config_file, "wb") as f:
            for chunk in config_response.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"  Saved to: {config_file}")

    layers = manifest.get("layers", [])
    print(f"Downloading {len(layers)} layers...")

    layer_files = []
    for idx, layer in enumerate(layers, 1):
        layer_digest = layer["digest"]
        layer_size = layer.get("size", 0)
        print(f"[{idx}/{len(layers)}] Layer: {layer_digest}")
        print(f"  Size: {layer_size / (1024 * 1024):.2f} MB")

        blob_url = f"https://{registry}/v2/{repo}/blobs/{layer_digest}"
        try:
            response = requests.get(
                blob_url, headers=headers, stream=True, timeout=300, verify=False
            )
            response.raise_for_status()

            layer_filename = f"layer-{idx}.tar.gz"
            filename = os.path.join(output_dir, layer_filename)

            downloaded = 0
            with open(filename, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
                    downloaded += len(chunk)
                    if layer_size > 0:
                        progress = (downloaded / layer_size) * 100
                        print(f"\r  Progress: {progress:.1f}%", end="", flush=True)

            print(f"\n  Saved to: {filename}")
            layer_files.append(layer_filename)

        except Exception as e:
            print(f"\n  Error: {e}")
            return False

    print("Creating OCI image layout...")
    podman_manifest = [
        {"Config": "config.json", "RepoTags": [f"{repo}:{tag}"], "Layers": layer_files}
    ]

    manifest_file = os.path.join(output_dir, "manifest.json")
    with open(manifest_file, "w") as f:
        json.dump(podman_manifest, f, indent=2)

    print("\n✓ Download complete!")
    print(f"Output directory: {output_dir}")

    import tarfile

    # TAR filename INSIDE images/ directory
    tar_filename = os.path.join(
        images_base_dir, f"{image_name.replace('/', '_')}_{tag}_{arch}.tar"
    )
    print(f"\nCreating TAR archive: {tar_filename}")

    with tarfile.open(tar_filename, "w") as tar:
        tar.add(output_dir, arcname=".")

    print(f"\n✓ TAR created: {tar_filename}")

    # Clean up temporary extraction directory
    print(f"Cleaning up temporary files: {output_dir}")
    shutil.rmtree(output_dir)

    return True


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python download-docker-image.py <image_name> [tag]")
        print("Usage: python download-docker-image.py batch <file.txt>")
        sys.exit(1)

    if sys.argv[1] == "batch":
        batch_file = sys.argv[2] if len(sys.argv) > 2 else "images_to_download.txt"
        if not os.path.exists(batch_file):
            print(f"File not found: {batch_file}")
            sys.exit(1)

        failed = []
        with open(batch_file, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    if ":" in line:
                        name, tag = line.rsplit(":", 1)
                    else:
                        name, tag = line, "latest"
                    if not download_image(name, tag):
                        failed.append(f"{name}:{tag}")

        if failed:
            print(f"\nFailed: {failed}")
            sys.exit(1)
        print("\n✓ All done")
    else:
        image = sys.argv[1]
        tag = sys.argv[2] if len(sys.argv) > 2 else "latest"
        success = download_image(image, tag)
        sys.exit(0 if success else 1)
