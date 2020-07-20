/* Plugin_DavisTubeTilt.js
 * Davis Wachtell
 *
 * This plugin displays images with lines drawn over it to emulate a tube tilt experiment.
 * Use it to record tilt angles from image judgements
 *
 * documentation: none. Look through the code its not too complicated. 
 *
 * Images must follow a specific naming convention and image style
 * - Viewing images in format `FaceType_ArrowDirection_TubeType`.jpg
 * - Moving images in format `FaceType`.jpg
 * - The exact center of the image must be the line anchor. The anchor position parameter is not *   working yet and will not work. 
 *
 *
 */

jsPsych.plugins['Davis-Tube-Tilt'] = (function () {

    /*

    ** Still To Do ** 
    - (Way later) generalize to more experiment types
    - 

    */

    var plugin = {};

    plugin.info = {
        name: 'DavisTubeTilt',
        description: 'Will run the moving phase of a tube tilt trial, with parameters specified',
        parameters: {
            img_Humanize: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: "Humanize Phase Image",
                default: null,
                desription: 'The desired image to be centered and shown during the Humanize Phase'
            },
            img_Viewing: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: "Viewing Phase Image",
                default: null,
                description: 'The desired image to be centered and shown during the Viewing Phase'
            },
            img_Moving: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: "Moving Phase Image",
                default: null,
                desription: 'The desired image to be centered and shown during the Moving Phase'
            },
            step_size: {
                type: jsPsych.plugins.parameterType.FLOAT,
                pretty_name: "Step size",
                default: [2],
                description: 'The Step size in degrees.'
            },
            key_increase: {
                type: jsPsych.plugins.parameterType.KEYCODE,
                pretty_name: 'Key increase',
                default: [39], // right arrow
                description: 'The key to press for increasing the parameter value.'
            },
            key_decrease: {
                type: jsPsych.plugins.parameterType.KEYCODE,
                pretty_name: 'Key decrease',
                default: [37], // left arrow
                description: 'The key to press for decreasing the parameter value.'
            },
            key_continue: {
                type: jsPsych.plugins.parameterType.KEYCODE,
                pretty_name: 'Key continue',
                default: [32], // spacebar
                description: 'The key to press for continuing to the next trial.',
            },
            anchor_point: {
                type: jsPsych.plugins.parameterType.FLOAT,
                pretty_name: 'Anchor Point',
                default: null,
                description: 'NOT IMPLEMENTED!! Pixel location in the moving image where the line is anchored. If null, the anchor point will be in the exact center of the viewing image'
            },
            allow_held_key: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: 'Allow Holding a Key',
                default: false,
                description: 'Allow the keys to be held to move the tube'
            },
            background_color: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Background Color',
                default: "#D3D3D3",
                description: "The background color as a hexadecimal value"
            },
            isPractice: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: 'Is Practice?',
                default: false,
                description: "If practice, data is marked"
            },
            verbose: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: 'Verbose',
                default: false,
                description: 'Print (to browser console) the state and position of line'
            }

        }
    }

    plugin.trial = function (display_element, trial) {

        /**************************/
        /**************************/
        /***Initalize  Variables***/
        /**************************/
        /**************************/
        //var display_element = jsPsych.getDisplayElement();
        const lineStart = 0;
        const tilt_rightMax = 90;
        const tilt_leftMax = -tilt_rightMax;
        var linePos = lineStart; // line position
        var tStart_Humanize, tEnd_Humanize, tStart_Viewing, tEnd_Moving, tStart_Moving, tEnd_Viewing
        const states = ["Humanize", "Viewing", "Moving"];
        var humanize_errorDelay = 1500; // 1.5 seconds
        var nHumanizeTrials = 0;

        // setup a state tracking object
        var state = {
            state_indx: 0,
            get cState() { return (states[this.state_indx]) }, // returns current state as a string
            get nextState() { if (this.state_indx < states.length) { this.state_indx++ } }, // increments the state 
            get isHumanize() {return (states[this.state_indx] == "Humanize") },
            get isViewing() { return (states[this.state_indx] == "Viewing") },
            get isMoving() { return (states[this.state_indx] == "Moving") },

        }

        /**************************/
        /**************************/
        /** Get Image Attributes **/
        /**************************/
        /**************************/

        // Original Image Size
        var img_Viewing = new Image();
        img_Viewing.src = trial.img_Viewing;
        const origImageDims = { // get real image size
            width: img_Viewing.width,
            height: img_Viewing.height,
        }

        // image path and parameters
        const imgViewing = trial.img_Viewing; // the image for the Viewing Screen
        const imgMoving = trial.img_Moving; // the image for the Moving Screen
        const imgHumanize = trial.img_Humanize; // the image for the Humanize Screen
        var tp = imgViewing.split("/")[2].split("_");
        var trialParams = { // the numeric index details are based on the file names
            FaceType: tp[0], // OC or CO
            TiltDirection: tp[1], // LEFT or RIGHT
            TubeType: tp[2].split(".")[0], // drop the .jpg element // TT, TF, ST, SF
            get isTiltingRight() {
                return (tp[1] == "RIGHT")
            },
        }


        /**************************/
        /**************************/
        /* Screen + new Image Size /
        /**************************/
        /**************************/

        // screen size
        const screenWidth = window.innerWidth // screen.availWidth;
        const screenHeight = window.innerHeight; // screen.availHeight

        // new image and canvas dimensions
        var ratio = origImageDims.width / screenWidth;
        var newImgHeight = Math.round(origImageDims.height / ratio);
        var canvHeight_NoImage = Math.floor((screenHeight - newImgHeight) / 2)

        /**************************/
        /**************************/
        /*** Humanization Phase ***/
        /**************************/
        /**************************/
        var drawHumanize = function () {
            if (!state.isHumanize) {alert('Not in Humanizing State'); return }

            console.log('drawHumanize')
            console.log('state: ' + state.cState)
            if (!state.isHumanize) {return}

            // start timer if not started
            if (tStart_Humanize == undefined) { tStart_Humanize = draw(); };

            // find correct key
            var keyCorrect = (trialParams.FaceType == "OC") ? trial.key_decrease : trial.key_increase


            // setup key listener
            var keyListener_Humanize = jsPsych.pluginAPI.getKeyboardResponse({
                callback_function: keyHandler_Humanize,
                valid_responses: [trial.key_increase, trial.key_decrease],
                rt_method: 'performance',
                persist: true,
                allow_held_key: false
            })

            // initilize timeout timer to be greater than timeout period (if no wrong answers, allows to continue immediately)
            var timeoutTimer;

            // setup key handler
            function keyHandler_Humanize(keyCode) {
                // find out if correct key was pressed
                if (jsPsych.pluginAPI.compareKeys(keyCode.key, keyCorrect)) {

                    // if timout timer is undefined ==> no missed trial, continue
                    // if timeout timer is defined ==> missed trial, ensure time since answer is greater than timeout
                    if( (timeoutTimer == undefined) || (performance.now() - timeoutTimer > humanize_errorDelay)){


                        // record end time
                        tEnd_Humanize = performance.now();

                        // cancel keyboard listener
                        jsPsych.pluginAPI.cancelKeyboardResponse(keyListener_Humanize)

                        // shift states
                        state.nextState;

                        // draw the viewing phase (and return for callback)
                        drawViewing(); return;
                    }
                } else {
                    timeoutTimer = performance.now();
                    display_element.innerHTML = `<p> Davis cannot see that side of the tube! <br> Please try again.`
                    jsPsych.pluginAPI.setTimeout(draw, humanize_errorDelay)
                }
            }


            function draw() {
                // increment number of humanize trials
                nHumanizeTrials ++;

                // question shown on screen
                var question = 'Does Davis see the left or right side of the tube? (Indicate using the arrows)'

                // get HTML
                html = `<!DOCTYPE html>`
                /* Style ELEMENTS */
                html += `<style>`
                html += `*{ cursor: none; overflow: hidden; background-color:` + trial.background_color + `; };`
                html += `</style>`

                html += `<html>`

                /* CANVAS ELEMENTS */
                html += `<body>`
                html += `<canvas id="Blank_TOP";    width = ` + screenWidth + `; height = ` + canvHeight_NoImage + `;></canvas>`
                html += `<canvas id="viewingImage"; width = ` + screenWidth + `; height = ` + newImgHeight       + `;></canvas>`
                html += `<canvas id="Blank_BOTTOM"; width = ` + screenWidth + `; height = ` + canvHeight_NoImage + `;></canvas>`
                html += `</body>`

                /* SCRIPT ELEMENTS */
                html += `<script>`

                // top canvas
                html += `var canvas_top = document.getElementById('Blank_TOP');` // get canvas
                html += `var ctx_top = canvas_top.getContext('2d');` // get 2d context
                html += `ctx_top.fillStyle = "black";` // set new fill color
                html += `ctx_top.textAlign = "center";` // center new text
                html += `ctx_top.font = "20px Arial";` // set font for new text
                html += `ctx_top.fillText("` + question + `", canvas_top.width / 2, canvas_top.height * 0.9);` // show text

                // canvas bottom
                html += `var canvas_bottom = document.getElementById('Blank_BOTTOM');`
                html += `var ctx_bottom = canvas_bottom.getContext('2d');`

                // canvas IMAGE
                html += `var canvas_IMG = document.getElementById('viewingImage');`
                html += `var ctx_IMG = canvas_IMG.getContext('2d');`
                html += `var img = new Image();`
                html += `img.src = '` + imgHumanize + `';`
                html += `ctx_IMG.drawImage(img, 0, 0, ` + screenWidth + `, ` + newImgHeight + `);`

                html += `</script>`

                // end HTML page
                html += `</html>`

                // send to applyScripts
                applyScripts(html);

                return (performance.now())
            }
        };

        /**************************/
        /**************************/
        /***** Viewing  Phase *****/
        /**************************/
        /**************************/

        var drawViewing = function () {
            if (trial.verbose) {console.log('drawViewing'); console.log('state: ' + state.cState)}

            // draw and record time
            if (tStart_Viewing == undefined) { tStart_Viewing = draw(); };

            // get the correct key response – 39 / Right arrow if tilting right
            var keyAllowed = trialParams.isTiltingRight ? trial.key_increase : trial.key_decrease // 

            // setup key listener
            var keyListener_Viewing = jsPsych.pluginAPI.getKeyboardResponse({
                callback_function: keyHandler_Viewing,
                valid_responses: [trial.key_increase, trial.key_decrease],
                rt_method: 'performance',
                persist: true,
                allow_held_key: false
            })

            // setup key handler
            function keyHandler_Viewing(keyCode) {

                // Correct Response
                if (jsPsych.pluginAPI.compareKeys(keyCode.key, keyAllowed)) {
                    // end viewing timer
                    tEnd_Viewing = performance.now();

                    // shift to next state
                    state.nextState;

                    // cancel keyboard listener
                    jsPsych.pluginAPI.cancelKeyboardResponse(keyListener_Viewing)

                    // shift line position (depends on tilt direction)
                    trialParams.isTiltingRight ? linePos += trial.step_size : linePos -= trial.step_size;

                    // draw moving (and return for callback)
                    drawMoving(); return;
                } else { // wrong key pressed (do nothing)
                    return
                }
            }

            // draw the viewing screen
            function draw() {

                var viewingText = 'Now, please indicate the tipping point angle...'

                // get HTML
                html = `<!DOCTYPE html>`

                /* Style ELEMENTS */
                html += `<style>`
                html += `*{ cursor: none; overflow: hidden; background-color:` + trial.background_color + `; };`
                html += `</style>`

                html += `<html>`

                /* CANVAS ELEMENTS */
                html += `<body>`
                html += `<canvas id="Blank_TOP";    width = ` + screenWidth + `; height = ` + canvHeight_NoImage + `;></canvas>`
                html += `<canvas id="viewingImage"; width = ` + screenWidth + `; height = ` + newImgHeight       + `;></canvas>`
                html += `<canvas id="Blank_BOTTOM"; width = ` + screenWidth + `; height = ` + canvHeight_NoImage + `;></canvas>`
                html += `</body>`

                /* SCRIPT ELEMENTS */
                html += `<script>`

                // top canvas
                html += `var canvas_top = document.getElementById('Blank_TOP');`
                html += `var ctx_top = canvas_top.getContext('2d');`
                html += `ctx_top.fillStyle = "black";`
                html += `ctx_top.textAlign = "center";`
                html += `ctx_top.font = "20px Arial";`
                html += `ctx_top.fillText("` + viewingText + `", canvas_top.width / 2, canvas_top.height * 0.9);`

                // canvas bottom requires no changes

                // canvas IMAGE
                html += `var canvas_IMG = document.getElementById('viewingImage');`
                html += `var ctx_IMG = canvas_IMG.getContext('2d');`
                html += `var img = new Image;`
                html += `img.src = '` + imgViewing + `';`
                html += `img.onload = function() { ctx_IMG.drawImage(img, 0, 0, ` + screenWidth + `, ` + newImgHeight + `); }`

                html += `</script>`

                // end HTML page
                html += `</html>`

                // send to applyScripts
                applyScripts(html);


                return (performance.now())
            }
        };


        /**************************/
        /**************************/
        /***** Moving  Phase *****/
        /**************************/
        /**************************/
        function drawMoving() {
            if (trial.verbose) {console.log('drawMoving'); console.log('state: ' + state.cState)}

            // draw and record time
            if (tStart_Moving == undefined) { tStart_Moving = draw() };

            // setup key listener
            var keyListener_Moving = jsPsych.pluginAPI.getKeyboardResponse({
                callback_function: keyHandler_Moving,
                valid_responses: [trial.key_increase, trial.key_decrease, trial.key_continue],
                rt_method: 'performance',
                persist: true,
                allow_held_key: trial.allow_held_key,
            })

            // setup key handler
            function keyHandler_Moving(keyCode) {
                // key continue
                if (jsPsych.pluginAPI.compareKeys(keyCode.key, trial.key_continue)) {

                    // record time
                    tEnd_Moving = performance.now();

                    // clear screen
                    display_element.innerHTML = '';

                    // end key listener
                    jsPsych.pluginAPI.cancelKeyboardResponse(keyListener_Moving);

                    // end trial
                    endTrial();

                    return;
                }

                // key decrease
                if (jsPsych.pluginAPI.compareKeys(keyCode.key, trial.key_decrease)) {

                    // if tilting RIGHT, decrease key's left bound is > lineStart
                    // if tilting LEFT, decrease key's left bound is > tilt_leftMax
                    if ((trialParams.isTiltingRight && (linePos > lineStart)) || // tilt RIGHT
                        (!trialParams.isTiltingRight && (linePos > tilt_leftMax))) { // tilt LEFT

                        // increment line
                        linePos -= trial.step_size;

                        // draw (and return for callback)
                        draw(); return;
                    } else {
                        return // do nothing if outside of bounds
                    } 
                }

                // key increase
                if (jsPsych.pluginAPI.compareKeys(keyCode.key, trial.key_increase)) {

                    // if tilting RIGHT, increase key's right bound is < tilt_rightMax
                    // if tilting LEFT, increase key's right bound is < lineStart (0)

                    if ((trialParams.isTiltingRight && (linePos < tilt_rightMax)) || // tilt RIGHT
                        ((!trialParams.isTiltingRight && (linePos < lineStart)))) { // tilt LEFT

                        // increment line
                        linePos += trial.step_size;

                        // draw (and return for callback)
                        draw(); return;
                    } else {
                        return; // do nothing if outside of bounds
                    }
                }
            }

            // draw the moving screen
            function draw() {
                console.log('linePos / draw(): ' + linePos)

                // get line Position in radians
                var linePos_Degree = linePos + 90; // re-orient so that 90 degrees is up
                var linePos_Rad = linePos_Degree * Math.PI / 180 // to radians

                // get HTML
                html = `<!DOCTYPE html>`

                // styles
                html += `<style type="text/css">`
                html += `*{ cursor: none; overflow: hidden; background-color:` + trial.background_color + `; };`
                html += `</style>`

                // start body
                html += `<html>`
                html += `<body>`

                // canvas elements
                html += `<canvas id="Blank_TOP";    width = ` + screenWidth + `; height = ` + canvHeight_NoImage + `;></canvas>`
                html += `<canvas id="movingImage"; width = ` + screenWidth + `; height = ` + newImgHeight       + `;></canvas>`
                html += `<canvas id="Blank_BOTTOM"; width = ` + screenWidth + `; height = ` + canvHeight_NoImage + `;></canvas>`

                // end body
                html += `</body>`

                // start scripts
                html += `<script>`

                // top canvas and bottom canvas require no changes

                // image canvas
                html += `var canvas_IMG = document.getElementById('movingImage');`
                html += `var ctx_IMG = canvas_IMG.getContext('2d');`
                html += `ctx_IMG.strokeStyle = '#000000';` // black line
                html += `ctx_IMG.lineWidth = 2;`

                // setup and draw image
                html += `var img = new Image();`
                html += `img.src = '` + imgMoving + `';`
                html += `ctx_IMG.drawImage(img, 0, 0, ` + screenWidth + `, ` + newImgHeight + `);`

                // setup line start and stop
                html += `var lineAnchor = [canvas_IMG.width / 2, canvas_IMG.height / 2];` // center of the image is the anchor
                html += `var lineLength = lineAnchor[1];` // line extends from anchor to the top of the image
                html += `var lineEND_X = lineAnchor[0] - (Math.cos(` + linePos_Rad + `) * lineLength);`
                html += `var lineEND_Y = lineAnchor[1] - (Math.sin(` + linePos_Rad + `) * lineLength);`

                // draw line
                html += `ctx_IMG.beginPath();`
                html += `ctx_IMG.moveTo(lineAnchor[0], lineAnchor[1]);`
                html += `ctx_IMG.lineTo(lineEND_X, lineEND_Y);`
                html += `ctx_IMG.stroke();`


                // end scripts
                html += `</script>`

                // end HTML page
                html += `</html>`

                // send to applyScripts
                applyScripts(html);


                return (performance.now())
            }
        }


        drawHumanize();








        /* When setting the html element using display_element.innerHTML, the scripts are not allowed to run. This function will curcumvent this (in an admittedly odd way) which will allow the scripts of the external html to run */
        function applyScripts(html) {

            // load html to display_element
            display_element.innerHTML = html;

            // get scripts and relocate to the proper script location
            for (const scriptElement of display_element.getElementsByTagName("script")) {
                //console.log(scriptElement)
                const relocatedScript = document.createElement("script");
                relocatedScript.text = scriptElement.text;
                scriptElement.parentNode.replaceChild(relocatedScript, scriptElement);
            };

            //console.log(display_element)

            // helper to load via XMLHttpRequest
            function load(element, file, callback) {
                console.log('used load function')
                var xmlhttp = new XMLHttpRequest();
                xmlhttp.open("GET", file, true);
                xmlhttp.onload = function () {
                    if (xmlhttp.status == 200 || xmlhttp.status == 0) { //Check if loaded
                        element.innerHTML = xmlhttp.responseText;
                        callback();
                    }
                }
                xmlhttp.send();
            }
            return;
        }

        function endTrial() {
            if (trial.verbose) {
                console.log('ended trial')
            }

            // clear keyboard response
            jsPsych.pluginAPI.cancelAllKeyboardResponses();

            // save data
            var trial_data = {
                "FinalLinePosition": linePos,
                "FaceType": trialParams.FaceType,
                "TiltDirection": trialParams.TiltDirection,
                "TubeType": trialParams.TubeType,
                "timeViewing": tEnd_Viewing - tStart_Viewing,
                "timeMoving": tEnd_Moving - tStart_Moving,
                "timeHumanize": tEnd_Humanize - tStart_Humanize,
                "nHumanizeTrials": nHumanizeTrials,
                "ViewingImage": imgViewing,
                "MovingImage": imgMoving,
                "isPractice": trial.isPractice,
            }

            display_element.innerHTML = '';

            jsPsych.finishTrial(trial_data);

        };





    };

    return plugin;

})();
