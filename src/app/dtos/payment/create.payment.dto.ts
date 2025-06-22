import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreatePaymentDTO {
  @IsNumber()
  @IsNotEmpty()
  amount: number;  

  @IsString()
  @IsNotEmpty()
  language: string;

  constructor(data: any) {
    this.amount = data.amount;
    this.language = data.language;
  }
}
