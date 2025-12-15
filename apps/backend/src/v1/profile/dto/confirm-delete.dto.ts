import { IsString, Equals } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Account Deletion Confirmation DTO
 * Requires user to type "DELETE" exactly to prevent accidental deletion
 */
export class ConfirmDeleteDto {
  @ApiProperty({
    description: 'Confirmation phrase (must be "DELETE" in all caps)',
    example: 'DELETE',
    pattern: '^DELETE$',
  })
  @IsString()
  @Equals('DELETE', { message: 'Must type "DELETE" exactly (all caps) to confirm' })
  confirmationPhrase!: string;
}
