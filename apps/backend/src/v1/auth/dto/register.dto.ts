import { IsEmail, IsString, MinLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Priya Sharma' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'priya@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecurePass@123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain uppercase, lowercase, number and special character',
  })
  password!: string;

  @ApiProperty({ example: 'iPhone 14 Pro', required: false })
  @IsOptional()
  @IsString()
  deviceName?: string;
}
