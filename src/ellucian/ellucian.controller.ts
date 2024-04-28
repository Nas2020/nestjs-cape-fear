import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { EllucianService } from './ellucian.service';
import { Response } from 'express';

@ApiTags('Ellucian')
@Controller('ellucian')
export class EllucianController {
  constructor(private readonly ellucianService: EllucianService) {}

  @Get('student-info')
  @ApiOperation({ summary: 'Retrieve student information by student number' })
  @ApiQuery({ name: 'studentNumber', required: true, type: String, description: 'The student number' })
  @ApiResponse({ status: 200, description: 'The student information' })
  async getStudentInfo(@Query('studentNumber') studentNumber: string, @Res() res: Response) {
    if (!studentNumber) {
        throw new Error('Student number is required');
      }

    try {
      let studentGuid ='';
      await this.ellucianService.getAccessToken(); 
      const studentInfo = await this.ellucianService.getPerson(studentNumber);
      if (studentInfo.length > 0){
         studentGuid = studentInfo[0].id
         
      } else{
      console.log("No Student found in the Database",studentInfo); 
      throw new Error('Ensure the student Number provided is correct');
      }
      const transcriptGrades = await this.ellucianService.getStudentTranscriptGrades(studentGuid);
      if (transcriptGrades.length < 0) {console.log("No Transcript Grades Available");
        throw new Error('Transcript Grades Empty')
      }
      // Map each transcriptGrade to fetch course details for each section
const courseDetailsPromises = transcriptGrades.map(async (grade) => {
    const sectionId = grade.course.section.id;
    if (!sectionId) {
        console.log("Section ID not found");
        return null; // or you can throw an error or handle it differently depending on your application logic
      }
    // Fetch course ID by section
    const result = await this.ellucianService.getCourseIdBySection(sectionId);
    if (!result) {
      console.log("No Course found for the section:", sectionId);
      return null; // or you can throw an error or handle it differently depending on your application logic
    }

    const courseId = result.course?.id ?? null;
    if (!courseId) {
        console.log("No courseId found");
        return null; // or you can throw an error or handle it differently depending on your application logic
      }
    // Fetch course details using the course ID
    const courseDetails = await this.ellucianService.getCourse(courseId);
    if (!courseDetails) {
      console.log("No Course details found for the given course ID:", courseId);
      return null; // or you can throw an error or handle it differently
    }

    const academicPeriodId = grade.academicPeriod?.id;
    if (!academicPeriodId) {
        console.log("academicPeriod ID not found");
        return null; // or you can throw an error or handle it differently depending on your application logic
      }

    const academicPeriod = await this.ellucianService.getAcademicPeriod(academicPeriodId);
    if (!academicPeriod) {
        console.log("Academic Period Details not Available for the Academic Period ID:", academicPeriodId);
        return null; // or you can throw an error or handle it differently
      }
    const gradeDefinitionId = grade.grade?.id ?? null;
    if (!gradeDefinitionId) {
        console.log("gradeDefinitionId ID not found");
        return null; // or you can throw an error or handle it differently depending on your application logic
      }

    const gradeInfo = await this.ellucianService.getGradeDefinition(gradeDefinitionId);
    if (!gradeInfo) {
        console.log("Grade Info not Available for the Grade Definition Id:", gradeDefinitionId);
        return null; // or you can throw an error or handle it differently
      }
    
    const transcript = {
        schoolYear: academicPeriod.category?.parent?.academicYear ?? null,
        term: academicPeriod.title ?? null,
        courseTitle: result.titles[0]?.value ?? null,
        courseCode: courseDetails.crsLocalGovtCodes[0]?.crsLocalGovtCodes ?? null,
        attemptedCredits: grade.credit?.attemptedCredit ?? null,
        earnedCredits: grade.credit?.earnedCredit ?? null,
        finalNumericGradeEarned: grade.credit?.qualityPoint?.gpa ?? null,    
        finalLetterGradeEarned: gradeInfo.grade?.value ?? null
    }

    return transcript;
  });
  
        // Resolve all promises from map
        const courseTranscript = await Promise.all(courseDetailsPromises);

      const gradePointAverages = await this.ellucianService.getStudentGradePointAverages(studentGuid);
      if (gradePointAverages.length < 0) {console.log("Student Grade Point Averages are not Available");
      throw new Error('Student Grade Point Averages   Empty')
     } 

    const studentId = [{
        firstName: studentInfo[0].names[0]?.firstName ?? null,
        middleName: studentInfo[0].names[0]?.middleName ?? null,
        lastName: studentInfo[0].names[0]?.lastName ?? null,
        studentID: studentInfo[0].studentsId.studentsId ?? null,
      }] 

      const studentCumulativeTranscript = [{
        cumulativeAttemptedCredits: gradePointAverages[0].cumulative[0]?.attemptedCredits ?? null,
        cumulativeEarnedCredits: gradePointAverages[0].cumulative[0]?.earnedCredits ?? null,
        cumulativeGradePointAverage: gradePointAverages[0].cumulative[0]?.value ?? null,
      }] 
     const finalExtractedStudentInfo = {
        studentId,
        studentCumulativeTranscript,
        courseTranscript
     }
      return res.json(finalExtractedStudentInfo);

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to retrieve student information', error: error.message });
    }
  }
}
