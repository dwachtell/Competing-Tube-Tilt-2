function gatherParticipantInfo() {


    /**************************/
    /**************************/
    /****** Prolific ID *******/
    /**************************/
    /**************************/
    /* Get Prolific ID (24 letters). If not possible, generate randomID (5 letters) */
    var urlvar = jsPsych.data.urlVariables();
    if(typeof(urlvar.PROLIFIC_PID) !== "undefined"){ //if PROLIFIC_PID exists
        var subject_id = urlvar.PROLIFIC_PID;
    } else { // if not conducting from prolific
        var subject_id = jsPsych.randomization.randomID(5);
    }


    /**************************/
    /**************************/
    /****** Browser Type ******/
    /**************************/
    /**************************/
    // Record basic variables from user
    var browser = (function (agent) {
        switch (true) {
            case agent.indexOf("edge") > -1: return "edge";
            case agent.indexOf("edg") > -1: return "chromium based edge (dev or canary)";
            case agent.indexOf("opr") > -1 && !!window.opr: return "opera";
            case agent.indexOf("chrome") > -1 && !!window.chrome: return "chrome";
            case agent.indexOf("trident") > -1: return "ie";
            case agent.indexOf("firefox") > -1: return "firefox";
            case agent.indexOf("safari") > -1: return "safari";
            default: return "other";
        }
    })(window.navigator.userAgent.toLowerCase());

    /**************************/
    /**************************/
    /****** Save Paths  *******/
    /**************************/
    /**************************/
    // filename will be in format TubeTilt_DD-MM-YY-HH-mm_UID.extension
    var expName = 'TubeTilt2';
    var today = new Date();    

    dateFormatted = [today.getFullYear(), today.getMonth(),
                     today.getDate(), today.getHours(),
                     today.getMinutes(),today.getSeconds(), today.getTimezoneOffset()].join("_")

    filename = [expName, dateFormatted, subject_id].join("_");

    csvFilename = filename + '.csv'
    jsonFilename = filename + '.json'   
    
    
    /**************************/
    /**************************/
    /***** OS and Versions ****/
    /**************************/
    /**************************/
    nav = window.navigator;
    platform = nav.platform;
    lang = nav.language;
    os_cpu = nav.oscpu;
    userAgent = nav.userAgent
    

    var ret = {
        date: today.toString(),
        date_ms: today.getTime(),
        subject_ID: subject_id,
        expName: expName,
        browser: browser,
        csvFilename: csvFilename,
        dateFormatted: dateFormatted,
        fileName: filename,
        jsonFilename: jsonFilename,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        platform: platform, 
        language: lang,
        os_cpu: os_cpu, 
        userAgent: userAgent
    };

    jsPsych.data.addProperties({subject_ID: subject_id,
                                expName: expName,
                                date: dateFormatted});


    return(ret)
}