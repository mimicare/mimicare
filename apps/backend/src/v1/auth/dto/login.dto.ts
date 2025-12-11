import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'User email address',
    required: true,
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'User password',
    required: true,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;

  @ApiProperty({
    example: 'Chrome - Laptop',
    description: 'Device name for multi-device session tracking',
    required: false,
  })
  @IsString()
  @IsOptional()
  deviceName?: string;
}
