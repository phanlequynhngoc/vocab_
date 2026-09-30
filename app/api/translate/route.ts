import { NextResponse } from "next/server";


export async function POST(
    request: Request
) {

    try {

        const {
            text,
            source,
            target

        } = await request.json();


        if (!text) {

            return NextResponse.json(
                {
                    error:"Missing word"
                },
                {
                    status:400
                }
            );

        }


        /*
        Sau này thay bằng:
        Google Translate API
        DeepL
        OpenAI

        */


        const translation =
        `Gợi ý nghĩa của ${text}`;


        return NextResponse.json({

            translation

        });


    } catch(error){

        return NextResponse.json(
            {
                error:"Server error"
            },
            {
                status:500
            }
        );

    }

}