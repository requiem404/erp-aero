import { IsString, Matches, MinLength } from 'class-validator';

const idPattern = /^(\+?\d{10,15}|[^@\s]+@[^@\s]+\.[^@\s]+)$/i;

export class SigninDto {
  @IsString()
  @Matches(idPattern, { message: 'id must be phone number or email' })
  id: string;

  @IsString()
  @MinLength(6)
  password: string;
}

