import { IsEnum, IsString, Matches, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CountryCode } from '@mimicare/schema';

export class SendOtpDto {
  @ApiProperty({ example: '+919876543210', description: 'Phone number with country code' })
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/, { message: 'Invalid phone number format' })
  phoneNumber!: string;

  @ApiProperty({ enum: CountryCode, default: CountryCode.IN })
  @IsEnum(CountryCode)
  countryCode: CountryCode = CountryCode.IN;

  @ApiProperty({ example: 'iPhone 14 Pro', required: false })
  @IsOptional()
  @IsString()
  deviceName?: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/)
  phoneNumber!: string;

  @ApiProperty({ enum: CountryCode, default: CountryCode.IN })
  @IsEnum(CountryCode)
  countryCode: CountryCode = CountryCode.IN;

  @ApiProperty({ example: '123456', description: '6-digit OTP code' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'OTP must be exactly 6 digits' })
  otpCode!: string;

  @ApiProperty({ example: 'iPhone 14 Pro' })
  @IsString()
  @MinLength(3)
  deviceName!: string;
}

export class ResendOtpDto {
  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/)
  phoneNumber!: string;

  @ApiProperty({ enum: CountryCode, default: CountryCode.IN })
  @IsEnum(CountryCode)
  countryCode: CountryCode = CountryCode.IN;
}
