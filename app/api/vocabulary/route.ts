import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


export async function POST(
    request: Request
) {

    const supabase =
        await createClient();



    const body =
        await request.json();



    const {
        folderId,
        word,
        meaning,
        phonetic,
        partOfSpeech,
        example,
        note,
        wordLanguage,
        meaningLanguage,

    } = body;




    const {
        data: userData,
        error: userError

    } =
        await supabase.auth.getUser();




    if (
        userError ||
        !userData.user
    ) {

        return NextResponse.json(
            {
                error: "Unauthorized"
            },
            {
                status: 401
            }
        );

    }






    const { error } =
        await supabase
            .from("vocabularies")
            .insert({

                folder_id: folderId,

                user_id: userData.user.id,

                word,

                meaning,

                phonetic,

                part_of_speech: partOfSpeech,

                example,

                note,

                word_language: wordLanguage,

                meaning_language: meaningLanguage,

            });






    if (error) {

        return NextResponse.json(
            {
                error: error.message
            },
            {
                status: 400
            }
        );

    }




    return NextResponse.json(
        {
            success: true
        }
    );


}