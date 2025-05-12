import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GlucoseService } from './glucose.service';
import { CreateGlucoseDto } from './dto/create-glucose.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateBulkGlucoseDto } from './dto/create-bulk-glucose.dto';
import { CreateGlucoseApiKeyDto } from './dto/create-glucose-api-key.dto';
import { BulkGlucoseApiKeyDto } from './dto/bulk-glucose-api-key.dto';
import { ApiKeyGuard } from './guards/api-key.guard';
import { UserApiKeyService } from './user-api-key.service';
import { ApiKeyDto } from './dto/api-key.dto';

@Controller('api/glucose')
export class GlucoseController {
  constructor(
    private readonly glucoseService: GlucoseService,
    private readonly userApiKeyService: UserApiKeyService,
  ) {}

  // Protected route: for web apps with authentication
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createReading(@Body() createGlucoseDto: CreateGlucoseDto) {
    return this.glucoseService.createReading(createGlucoseDto);
  }

  // API key route: for IoT devices
  @Post('device')
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.CREATED)
  async createReadingWithApiKey(@Body() dto: CreateGlucoseApiKeyDto, @Request() req) {
    // The API key guard adds the user to the request
    const userId = req.user.userId;
    
    return this.glucoseService.createReading({
      userId,
      value: dto.value,
      timestamp: dto.timestamp,
    });
  }

  // Protected route: for web apps with authentication
  @UseGuards(JwtAuthGuard)
  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  async createBulkReadings(@Body() dto: CreateBulkGlucoseDto) {
    return this.glucoseService.createBulkReadings(dto);
  }

  // API key route: for IoT devices
  @Post('device/bulk')
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.CREATED)
  async createBulkReadingsWithApiKey(@Body() dto: BulkGlucoseApiKeyDto, @Request() req) {
    // The API key guard adds the user to the request
    const userId = req.user.userId;
    
    return this.glucoseService.createBulkReadings({
      userId,
      readings: dto.readings,
    });
  }

  // Generate API key for a user
  @UseGuards(JwtAuthGuard)
  @Post('generate-api-key/:userId')
  async generateApiKey(@Param('userId') userId: string) {
    const apiKey = await this.userApiKeyService.generateApiKeyForUser(userId);
    return { apiKey };
  }

  // Protected route: Get all readings for a user
  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  async getUserReadings(
    @Param('userId') userId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('from') fromTimestamp?: string,
    @Query('to') toTimestamp?: string,
  ) {
    return this.glucoseService.getUserReadings(
      userId, 
      limit,
      fromTimestamp ? new Date(fromTimestamp) : undefined,
      toTimestamp ? new Date(toTimestamp) : undefined
    );
  }

  // API key route: for IoT devices to check their latest reading
  @UseGuards(ApiKeyGuard)
  @Get('device/latest')
  async getLatestReadingWithApiKey(@Request() req) {
    const userId = req.user.userId;
    return this.glucoseService.getLatestReading(userId);
  }

  // Protected route: Get latest reading for a user
  @UseGuards(JwtAuthGuard)
  @Get('latest/:userId')
  async getLatestReading(@Param('userId') userId: string) {
    return this.glucoseService.getLatestReading(userId);
  }
}