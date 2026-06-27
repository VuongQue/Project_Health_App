import { IsArray, IsString, ArrayNotEmpty } from "class-validator";

export class CreateStoryDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  media: string[];
}
