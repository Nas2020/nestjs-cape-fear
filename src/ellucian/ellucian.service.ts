import { Injectable} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EllucianService {
  private accessToken: string = '';
  private apiUrl: string;
  private authUrl: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService
  ) {
    const baseUrl = this.configService.get<string>('ELLUCIAN_BASE_API_URL');
    const authRoute = this.configService.get<string>('ELLUCIAN_AUTH_ROUTE');
    this.authUrl = `${baseUrl}${authRoute}`;
    this.apiUrl = baseUrl;
    
  }

  async getAccessToken(): Promise<void> {
    const headersRequest = { 'Authorization': `Bearer ${this.configService.get<string>('ELLUCIAN_API_KEY')}` };
    return this.httpService.post(this.authUrl, {}, { headers: headersRequest })
      .toPromise()
      .then(response => {
        this.accessToken = response.data;
      })
      .catch(error => {
        console.error('Failed to get access token:', error.message);
        throw new Error('Authentication failed');
      });
  }

  async getPerson(studentNumber: string): Promise<any> {
    if (!studentNumber) {
      throw new Error('Student number is required');
    }

    const apiRoute = this.configService.get<string>('ELLUCIAN_PERSON_API_ROUTE', '');
    const url = `${this.apiUrl}${apiRoute}?criteria={"credentials":[{"type":"colleaguePersonId","value":"${studentNumber}"}]}`;
    return this.httpService.get(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    }).toPromise()
    .then(response => {
      if ([301, 302].includes(response.status)) { 
        console.log('Redirected to:', response.headers.location);
        throw new Error('Request was redirected');
      }
      return response.data;
    })
    .catch(error => {
      console.error('Error fetching student information:', error);
      throw new Error('Failed to fetch student information');
    });
  }


async getStudentTranscriptGrades(studentGuid: string): Promise<any> {
  const apiRoute = this.configService.get<string>('ELLUCIAN_TRANSCRIPT_API_ROUTE', '');
  const url = `${this.apiUrl}${apiRoute}?criteria={"student":{"id":"${studentGuid}"}}`;
  return this.fetchFromEllucian(url);
}

async getStudent(studentGuid: string): Promise<any> {
  const apiRoute = this.configService.get<string>('ELLUCIAN_STUDENT_API_ROUTE', '');
  const url = `${this.apiUrl}${apiRoute}?criteria={"person":{"id":"${studentGuid}"}}`;
  return this.fetchFromEllucian(url);
}

async getCourseIdBySection(sectionId: string): Promise<any> {
  const apiRoute = this.configService.get<string>('ELLUCIAN_SECTIONS_API_ROUTE', '');
  const url = `${this.apiUrl}${apiRoute}/${sectionId}`;
  return this.fetchFromEllucian(url);
}

async getCourse(courseId: string): Promise<any> {
  const apiRoute = this.configService.get<string>('ELLUCIAN_COURSES_API_ROUTE', '');
  const url = `${this.apiUrl}${apiRoute}/${courseId}`;
  return this.fetchFromEllucian(url);
}

async getAcademicPeriod(academicPeriodId: string): Promise<any> {
  const apiRoute = this.configService.get<string>('ELLUCIAN_ACADEMIC_PERIOD_API_ROUTE', '');
  const url = `${this.apiUrl}${apiRoute}/${academicPeriodId}`;
  return this.fetchFromEllucian(url);
}

async getGradeDefinition(gradeDefinitionId: string): Promise<any> {
  const apiRoute = this.configService.get<string>('ELLUCIAN_ACADEMIC_GRADE_DEF_API_ROUTE', '');
  const url = `${this.apiUrl}${apiRoute}/${gradeDefinitionId}`;
  return this.fetchFromEllucian(url);
}

async getStudentGradePointAverages(studentGuid: string): Promise<any> {
  const apiRoute = this.configService.get<string>('ELLUCIAN_GRADE_POINT_AVERAGE_API_ROUTE', '');
  const url = `${this.apiUrl}${apiRoute}?criteria={"student":{"id":"${studentGuid}"}}`;
  return this.fetchFromEllucian(url);
}

private async fetchFromEllucian(url: string): Promise<any> {
  try {
      const response = await this.httpService.get(url, {
          headers: { Authorization: `Bearer ${this.accessToken}` }
      }).toPromise();
      if (response.status === 301 || response.status === 302) {
          throw new Error('Request was redirected');
      }
      return response.data;
  } catch (error) {
      console.error(`Error accessing ${url}:`, error.message);
      throw new Error('Failed to fetch data from Ellucian API');
  }
}

}
