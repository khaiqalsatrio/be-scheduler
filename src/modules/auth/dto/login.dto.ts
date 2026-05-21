import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  /**
   * Email address of the user
   * @example "user@example.com"
   */
  @IsEmail()
  email: string;

  /**
   * Password
   * @example "secret123"
   */
  @IsString()
  @IsNotEmpty()
  password: string;
}
