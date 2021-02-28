import { Request, Response} from "express"
import { getCustomRepository, Not, IsNull } from "typeorm";
import { SurveyUsersRepository } from "../repositories/SurveysUsersRepository";

class NpsController {

    async execute(request: Request, response: Response){
        const { survey_id } = request.params;

        const surveyUsersRepository = getCustomRepository(SurveyUsersRepository);
    
        const surveyUser = await surveyUsersRepository.find({
            survey_id,
            value: Not(IsNull())
        });

        const detractor = surveyUser.filter(
            (survey) => survey.value >= 0 && survey.value <= 6
        ).length;

        const promoters = surveyUser.filter(
            (survey) => survey.value >= 9 && survey.value <= 10
        ).length;

        const passive = surveyUser.filter(
            (survey) => survey.value >= 7 && survey.value <= 8
        ).length;

        const totalAnswers = surveyUser.length;

        const calculate = Number(((100 * (promoters - detractor)) / totalAnswers).toFixed(2));

        return response.json({
            detractor,
            promoters,
            passive,
            totalAnswers,
            nps: calculate
        })
    }
}

export { NpsController };