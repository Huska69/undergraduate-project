import { 
  Controller, 
  Post, 
  Body, 
  Get,
  Query,
  UseGuards,
  Req
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GlucoseService } from './glucose.service';
import { CreateGlucoseDto } from './dto/create-glucose.dto';

@Controller('glucose')
@UseGuards(JwtAuthGuard)
export class GlucoseController {
  constructor(private readonly glucoseService: GlucoseService) {}

  @Post()
  async create(
    @Req() req, 
    @Body() dto: CreateGlucoseDto
  ) {
    const reading = await this.glucoseService.create(req.user.id, dto);
    return { success: true, reading };
  }

  @Get()
  async findAll(
    @Req() req,
    @Query('limit') limit: string = '20',
    @Query('since') since?: string
  ) {
    const readings = await this.glucoseService.findAll(
      req.user.id,
      Number(limit),
      since ? new Date(since) : undefined
    );
    return { success: true, readings };
  }
}