import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class InterestItem {
  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  sub_category: string;
}

export class OnboardingDto {
  @IsArray()
  @IsString({ each: true })
  references: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InterestItem)
  interests: InterestItem[];
}
