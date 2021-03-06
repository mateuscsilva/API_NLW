import { Request, Response } from "express"
import { getCustomRepository } from "typeorm";
import { SurveysRepository } from "../repositories/SurveysRepository";
import { SurveyUsersRepository } from "../repositories/SurveysUsersRepository";
import { UserRepository } from "../repositories/UserRepository";
import sendMailService from "../services/sendMailService";
import { resolve } from "path";
import { AppError } from "../errors/AppError";

class SendMailController {
    async execute(request: Request, response: Response){
        const { email, survey_id } = request.body;

        const userRepository = getCustomRepository(UserRepository);
        const surveysRepository = getCustomRepository(SurveysRepository);
        const surveysUsersRepository = getCustomRepository(SurveyUsersRepository);

        const user = await userRepository.findOne({ email });

        if(!user){
            throw new AppError("User does not exists");
        }

        const survey = await surveysRepository.findOne({id: survey_id});

        if(!survey){
            throw new AppError("Survey does not exists");
        }

        const npsPath = resolve(__dirname, "..", "views", "emails", "npsMail.hbs");

        const surveysUsersAlreadyExists = await surveysUsersRepository.findOne({
            where: {user_id: user.id, value: null},
            relations: ["user", "survey"]
        })
        
        const variables = {
            name: user.name,
            title: survey.title,
            description: survey.description,
            id: "",
            link: process.env.URL_MAIL
        }

        if(surveysUsersAlreadyExists){
            variables.id = surveysUsersAlreadyExists.id;
            await sendMailService.execute(email, survey.title, variables, npsPath);
            return response.json(surveysUsersAlreadyExists);
        }

        //Salvar as informações na tabela
        const surveyUser = surveysUsersRepository.create({
            user_id: user.id,
            survey_id
        })
        await surveysUsersRepository.save(surveyUser);

        //Enviar email para o usuário
        variables.id = surveyUser.id;

        await sendMailService.execute(email, survey.title, variables, npsPath);

        return response.json(surveyUser);
    }
}

export { SendMailController }