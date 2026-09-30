"use client";

import { useState } from "react";


const languages = [
    {
        code: "en-US",
        name: "English",
    },
    {
        code: "zh-CN",
        name: "Chinese",
    },
    {
        code: "ja-JP",
        name: "Japanese",
    },
    {
        code: "ko-KR",
        name: "Korean",
    },
    {
        code: "vi-VN",
        name: "Vietnamese",
    },
];



export default function VocabularyForm(
    {
        folderId,
    }: {
        folderId: string;
    }

) {


    const [word, setWord] = useState("");

    const [meaning, setMeaning] = useState("");

    const [phonetic, setPhonetic] = useState("");

    const [partOfSpeech, setPartOfSpeech] = useState("");

    const [example, setExample] = useState("");

    const [note, setNote] = useState("");


    const [wordLanguage, setWordLanguage]
        =
        useState("en-US");


    const [meaningLanguage, setMeaningLanguage]
        =
        useState("vi-VN");



    const [saving, setSaving] =
        useState(false);



    // ====================
    // TEXT TO SPEECH
    // ====================

    function speakWord() {

        if (!word.trim())
            return;


        const utterance =
            new SpeechSynthesisUtterance(word);


        utterance.lang =
            wordLanguage;


        utterance.rate =
            0.8;


        window.speechSynthesis.cancel();

        window.speechSynthesis.speak(
            utterance
        );

    }




    // ====================
    // SAVE VOCABULARY
    // ====================

    async function addWord() {


        try {

            setSaving(true);


            const response =
                await fetch(
                    "/api/vocabulary",
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },


                        body: JSON.stringify({

                            folderId,

                            word,

                            meaning,

                            phonetic,

                            partOfSpeech,

                            example,

                            note,

                            wordLanguage,

                            meaningLanguage,

                        }),

                    }
                );



            const data =
                await response.json();



            if (!response.ok) {

                alert(data.error);

                return;

            }



            alert("Added vocabulary");


            window.location.reload();



        }
        catch (error) {

            console.error(error);

            alert("Something went wrong");


        }
        finally {

            setSaving(false);

        }


    }




    return (

        <div className="space-y-4">


            <h2 className="text-lg font-bold">
                Add vocabulary
            </h2>




            {/* WORD LANGUAGE */}

            <select

                value={wordLanguage}

                onChange={
                    e => setWordLanguage(e.target.value)
                }

                className="
        w-full
        rounded-xl
        border
        px-3
        py-2.5
        "

            >

                {
                    languages.map(
                        lang => (

                            <option
                                key={lang.code}
                                value={lang.code}
                            >
                                {lang.name}
                            </option>

                        )
                    )
                }

            </select>






            {/* WORD + SOUND */}

            <div className="flex gap-2">


                <input

                    value={word}

                    onChange={
                        e => setWord(e.target.value)
                    }

                    placeholder="Word"

                    className="
          flex-1
          rounded-xl
          border
          px-3
          py-2.5
          "

                />



                <button

                    type="button"

                    onClick={speakWord}

                    className="
          rounded-xl
          bg-indigo-600
          px-4
          text-white
          "

                >

                    🔊

                </button>


            </div>






            {/* MEANING LANGUAGE */}


            <select

                value={meaningLanguage}

                onChange={
                    e => setMeaningLanguage(e.target.value)
                }

                className="
        w-full
        rounded-xl
        border
        px-3
        py-2.5
        "

            >

                {
                    languages.map(
                        lang => (

                            <option
                                key={lang.code}
                                value={lang.code}
                            >

                                Meaning:
                                {" "}
                                {lang.name}

                            </option>

                        )
                    )
                }


            </select>






            <textarea

                value={meaning}

                onChange={
                    e => setMeaning(e.target.value)
                }

                placeholder="Meaning"

                rows={3}

                className="
        w-full
        rounded-xl
        border
        px-3
        py-2.5
        "

            />







            <div className="grid grid-cols-2 gap-3">


                <input

                    value={phonetic}

                    onChange={
                        e => setPhonetic(e.target.value)
                    }

                    placeholder="Phonetic"

                    className="
          rounded-xl
          border
          px-3
          py-2.5
          "

                />



                <input

                    value={partOfSpeech}

                    onChange={
                        e => setPartOfSpeech(e.target.value)
                    }

                    placeholder="Part of speech"

                    className="
          rounded-xl
          border
          px-3
          py-2.5
          "

                />


            </div>






            <textarea

                value={example}

                onChange={
                    e => setExample(e.target.value)
                }

                placeholder="Example sentence"

                rows={3}

                className="
        w-full
        rounded-xl
        border
        px-3
        py-2.5
        "

            />






            <textarea

                value={note}

                onChange={
                    e => setNote(e.target.value)
                }

                placeholder="Note"

                rows={2}

                className="
        w-full
        rounded-xl
        border
        px-3
        py-2.5
        "

            />






            <button

                type="button"

                disabled={saving}

                onClick={addWord}

                className="
        w-full
        rounded-xl
        bg-indigo-600
        px-4
        py-3
        font-semibold
        text-white
        "

            >

                {
                    saving
                        ?
                        "Saving..."
                        :
                        "Add word"
                }


            </button>



        </div>

    );

}