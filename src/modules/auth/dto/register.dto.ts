import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  /**
   * Email address of the user
   * @example "user@example.com"
   */
  @IsEmail()
  email: string;

  /**
   * Full name of the user
   * @example "John Doe"
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * Unique username of the user
   * @example "johndoe"
   */
  @IsString()
  @IsNotEmpty()
  username: string;

  /**
   * Password (min 6 characters)
   * @example "secret123"
   */
  @IsString()
  @MinLength(6)
  password: string;
}
