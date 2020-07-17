
// initilize a bin to record participant information
var nonMainResponseBin = {
    consent: null, age: null, gender: null,
    handedness: null, CheckInstructionsAreUnderstood: null,
    Hypothesis: null, HeadInfluence_Bool: null,
    HeadInfluence_string: null, AdditionalComments: null,
}

/**************************/
/**************************/
/* PRE EXPERIMENT SURVEYS */
/**************************/
/**************************/

var pre_exp_survey_1 = {
    type: 'survey-html-form',
    preamble: '<p><b>Consent</b> </p>',
    html: '<p><div style="max-width:600px;">Please read the <a href="docs/online_consent_form.pdf" target="_blank">consent form</a> (opens in new window) carefully. By clicking the consent button below, you certify that you have read the consent form and consent to participate. If you do not consent, simply close this webpage.</div></p>',
    button_label: 'I consent',
    on_finish: function(){
        nonMainResponseBin.consent = true;
    },
};

var pre_exp_survey_2 = {
    type: 'survey-text',
    preamble: '<b><u>Basic information (1/3)</u></b>',
    questions: [
        {prompt: "<b>Your age:</b>", name: 'age', required: 'true',rows: 1, columns: 2},
    ],
    on_finish: function(data){
        nonMainResponseBin.age = JSON.parse(data.responses).age;
    },
};

var pre_exp_survey_3 = {
    type: 'survey-multi-choice',
    preamble: '<b><u>Basic information (2/3)</u></b>',
    questions: [
        {prompt: "<b>Gender:</b>", name: 'sex', options: ["Male", "Female"], required: true},
    ],
    on_finish: function(data){
        nonMainResponseBin.gender = JSON.parse(data.responses).sex;
    },
};

var pre_exp_survey_4 = {
    type: 'survey-multi-choice',
    preamble: '<b><u>Basic information (3/3)</u></b>',
    questions: [{prompt: "<b>Handedness:</b>", name: 'handedness', options: ["Right", "Left"], required: true}],
    on_finish: function(data){
        nonMainResponseBin.handedness = JSON.parse(data.responses).handedness;
    },
};

var pre_exp_survey_block = {
    timeline: [pre_exp_survey_1,pre_exp_survey_2,pre_exp_survey_3, pre_exp_survey_4],
}




/**************************/
/**************************/
/* POST EXPERIMENT SURVEY */
/**************************/
/**************************/

var post_exp_survey_1 = {
    type: 'survey-text',
    questions: [{prompt: "What do you think the hypothesis of the experiment was?",
                 name: 'Hypothesis', required: 'true',
                 rows: 5, columns: 80},],
    on_load: function() {document.querySelector('head').insertAdjacentHTML('beforeend', '<style id="cursor-toggle"> html { cursor: default; } </style>');},
    on_finish: function(data){
        nonMainResponseBin.Hypothesis = JSON.parse(data.responses).Hypothesis;
    },
};

var post_exp2_ifYes = {
    timeline: [post_exp_survey_2],
    conditional_function: function(){
        // long winded way of getting the data from the last response
        if (JSON.parse(jsPsych.data.getLastTrialData(1).values()[0].responses).Influence_YesOrNo == "Yes")
        { return true } else { return false}
    },
    type: 'survey-text',
    questions: [{prompt: '<div style="max-width:600px;">Please describe in what way the presence of Will and Davis influenced your performance on the tube tilting task:</div>',
                name: "influence_string", rows: 5, columns: 80, required: true},],
    on_finish: function(data){
        nonMainResponseBin.HeadInfluence_string = JSON.parse(data.responses).influence_string;
    }

}

var post_exp_survey_2 = {
    type: 'survey-multi-choice',
    questions:  [{prompt: '<div style="max-width:600px;">Did the presence of Will and Davis influence your performance on the tube tilting task?</div>', name: 'Influence_YesOrNo', options: ["Yes", "No"], required:true},],
    on_finish: function(data){
        nonMainResponseBin.HeadInfluence_Bool = JSON.parse(data.responses).Influence_YesOrNo;
    },
};



var post_exp_survey_3 = {
    type: 'survey-text',
    questions: [
        {prompt: "Any additional comments about the experiment:",
         name: 'AdditionalComments', required: false, rows: 5, columns: 80},
    ],
    on_finish: function(data) {
        nonMainResponseBin.AdditionalComments = JSON.parse(data.responses).AdditionalComments;
    }
};



var post_exp_survey_block = {
    timeline: [post_exp_survey_1, post_exp_survey_2, post_exp2_ifYes, post_exp_survey_3], 
}


