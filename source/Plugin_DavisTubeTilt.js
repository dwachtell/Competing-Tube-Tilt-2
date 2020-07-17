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

jsPsych.plugins['Davis-Tube-Tilt'] = (function(){
    
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
            img_Viewing: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: "Viewing Phase Image",
                default: null,
                description: 'The desired image to be centered and shown during the Viewing Phase'
            },
            img_Moving:{
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
            isPractice: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: 'Is Practice?',
                default: false,
                description: "If practice, data is marked"
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
            verbose: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: 'Verbose',
                default: false,
                description: 'Print (to browser console) the state and position of line'
            }

        }
    }

    plugin.trial = function(display_element, trial) {
        
        var verbose = trial.verbose;

        // Initialize Variables 
        const lineStart = 0; // line starts vertical (0 degrees)
        const tilt_leftMax = -90; 
        const tilt_rightMax = 90;
        var linePos = lineStart;
        var stateViewing = true; // trial operates with either a viewing state or a moving state
        // timing parameters
        var tStart_Viewing;
        var tEnd_Moving;
        var tStart_Moving = null;
        var tEnd_Viewing = null;

        
        // get image for original image size
        var img_Viewing = new Image();
        img_Viewing.src = trial.img_Viewing;
        const origImageDim = { // get real image size
            width: img_Viewing.width,
            height: img_Viewing.height,
        }
        
        // store image paths for html calls
        const imgViewing = trial.img_Viewing; // the image for the Viewing Screen
        const imgMoving  = trial.img_Moving; // the image for the Moving Screen
        var trialParams = imgViewing.split("/")[2].split("_");
        var trialParams = { // the numeric details are based on the file names
            "FaceType": trialParams[0],
            "TiltDirection": trialParams[1],
            "TubeType": trialParams[2].split(".")[0]
        }
        
        // get screen size
        const screenWidth = window.innerWidth // screen.availWidth;
        const screenHeight = window.innerHeight;// screen.availHeight
        if (verbose) {console.log('imgViewing:' + imgViewing); console.log('imgMoving' + imgMoving)};

        
        // calculate appropriate image size
        var ratio = origImageDim.width / screenWidth;
        var newImgHeight = Math.round(origImageDim.height / ratio);
        var canvHeight_NoImage = Math.floor((screenHeight - newImgHeight) / 2);   // Math.floor ensures that the canvas boundaries are not larger than screen to avoid scrollable screens

        // get allowed tilt direction from image names (important for correct movement directions)
        const tiltRIGHT = trialParams.TiltDirection == "RIGHT"; // true if tilting RIGHT
        
        // Check for keycode changes (listen for responses)
        var key_listener = jsPsych.pluginAPI.getKeyboardResponse({
            callback_function: keyParser,
            valid_responses: [trial.key_increase, trial.key_decrease, trial.key_continue],
            rt_method: 'performance',
            persist: true,
            allow_held_key: trial.allow_held_key,
        });
        if (verbose) {console.log('Listening for Keys: ' + trial.key_increase + ', ' + trial.key_decrease + ', and ' + trial.key_continue)}
             
        // Start Experiment
        drawViewing();

        // Parse the keyCode Response when made
        function keyParser(keyCode){
            
            // if the buttons are not the numerical keynumber, then its a string keycode (ex. 'f', 'j')
            var keyRight = (typeof trial.key_increase == 'string') ? jsPsych.pluginAPI.convertKeyCharacterToKeyCode(trial.key_increase) : trial.key_increase;
            var keyLeft = (typeof trial.key_decrease == 'string') ? jsPsych.pluginAPI.convertKeyCharacterToKeyCode(trial.key_decrease) : trial.key_decrease;
            var keyContinue = (typeof trial.key_continue == 'string') ? jsPsych.pluginAPI.convertKeyCharacterToKeyCode(trial.key_continue) : trial.key_continue;
            
            // print status of key and line
            if (verbose) {console.log('stateViewing: ' + stateViewing); console.log('keyCode: ' + keyCode.key); console.log('linePos: ' + linePos)}
            
            // stop viewing timer upon first keystroke
            if (tEnd_Viewing == null) {
                    tEnd_Viewing = performance.now();
            }


            if ((keyCode.key == keyRight) && (linePos < tilt_rightMax)) {
                // if tilting right and line position is less than 90, do nothing
                // if tilting left and line posiiton is greater than 90, do nothing
                if ( (tiltRIGHT  && (linePos < lineStart)) || (!tiltRIGHT && (linePos > lineStart - 1)) ) { linePos = lineStart; return;  } 
                
                
                // adjust object states
                linePos += trial.step_size;
                stateViewing = false;
                
                drawMoving(); return;
            }

            if (keyCode.key == keyLeft && (linePos > tilt_leftMax)) {
                // if tilting right and the line position is less than 90, do nothing.
                // if tilting left and the line position is greater than 90, do nothing.
                if ( (tiltRIGHT && (linePos < lineStart + 1)) || (!tiltRIGHT && (linePos > lineStart)) ) { linePos = lineStart; return }
                
                // // adjust object states
                linePos -= trial.step_size;
                stateViewing = false;
                
                drawMoving(); return;
            }

            if ((keyCode.key == keyContinue) && (!stateViewing)) {      
                // stop moving period timer
                tEnd_Moving = performance.now();
                
                // end trial
                endTrial(); return;
            }
            

        }
        
        // function to draw the viewing screen
        function drawViewing() {
            // start viewing timer 
            tStart_Viewing = performance.now();

            html = 
                `
            <!DOCTYPE html>
            <style type="text/css">
                * {cursor: none;}
            </style>

            <html>
                <body>
                    <canvas id='Blank_TOP' width = ` + screenWidth + ` height= ` + canvHeight_NoImage + `></canvas>
                    <canvas id="viewingImage" width=` + screenWidth + ` height= ` + newImgHeight + `></canvas>
                    <canvas id='Blank_BOTTOM' width = ` + screenWidth + ` height = ` + canvHeight_NoImage + `></canvas>
                </body>
            
                <script>
                    var canvas_top = document.getElementById('Blank_TOP');
                    var ctx_top = canvas_top.getContext('2d');
                    ctx_top.fillStyle = "` + trial.background_color + `";
                    ctx_top.fillRect(0, 0, canvas_top.width, canvas_top.height);

                    var canvas_bottom = document.getElementById('Blank_BOTTOM');
                    var ctx_bottom = canvas_bottom.getContext('2d');
                    ctx_bottom.fillStyle = "` + trial.background_color + `";
                    ctx_bottom.fillRect(0, 0, canvas_bottom.width, canvas_bottom.height);

                    var canvas_IMG = document.getElementById('viewingImage');
                    var ctx_IMG = canvas_IMG.getContext('2d');

                    var img = new Image;
                    img.src = '` + imgViewing + `';

                    img.onload = function() {
                        ctx_IMG.drawImage(img, 0, 0, ` + screenWidth + `, ` + newImgHeight + `);
                    }


                </script>

            </html>
            `;
            
            applyScripts(html)
        };

        // function to draw the moving screen
        function drawMoving() {
            // start moving timer only if no previous start time set
            if (tStart_Moving == null) {
                tStart_Moving = performance.now()
            }
            
            var linePos_Degree = linePos + 90; // re-orient so that 90 degrees is up
            var linePos_Rad = linePos_Degree * Math.PI / 180 // to radians
            
            html = `
            <!DOCTYPE html>
            <style type="text/css">
                * {cursor: none;}
            </style>

            <html>
                <style> 
                    .stop-scrolling { 
                        overflow: hidden; 
                    } 
                </style>
                <body>
                     <canvas id='Blank_TOP' onload='loadimage' class='stop-scrolling' width = ` + screenWidth + ` height= ` + canvHeight_NoImage + `></canvas>
                     <canvas id='movingImage' class='stop-scrolling' width=` + screenWidth + ` height= ` + newImgHeight + `></canvas>
                     <canvas id='Blank_BOTTOM' class='stop-scrolling' width = ` + screenWidth + ` height = ` + canvHeight_NoImage + `></canvas>
                </body>

                <script>                    

                    // Dimensions and attributes For the TOP pannel
                    var canvas_top = document.getElementById('Blank_TOP');
                    var ctx_top = canvas_top.getContext('2d');
                    ctx_top.fillStyle = "` + trial.background_color + `";
                    ctx_top.fillRect(0, 0, canvas_top.width, canvas_top.height);


                    // Dimensions and attributes of the BOTTOM pannel
                    var canvas_bottom = document.getElementById('Blank_BOTTOM');
                    var ctx_bottom = canvas_bottom.getContext('2d');
                    ctx_bottom.fillStyle = "` + trial.background_color + `";
                    ctx_bottom.fillRect(0, 0, canvas_bottom.width, canvas_bottom.height);


                    // Dimensions and attributes of the IMAGE pannel
                    var canvas_IMG = document.getElementById('movingImage');
                    var ctx_IMG = canvas_IMG.getContext('2d');
                    ctx_IMG.strokeStyle = '#000000'; // black
                    ctx_IMG.lineWidth = 2;


                    // Get line start and stop
                    
                    var lineAnchor = [canvas_IMG.width / 2, canvas_IMG.height / 2]; // center of image is anchor
                    var lineLength = lineAnchor[1]; // because line extends from anchor to top of image
                    var lineEND_X = lineAnchor[0] - (Math.cos(` + linePos_Rad + `) * lineLength);
                    var lineEND_Y = lineAnchor[1] - (Math.sin(` + linePos_Rad + `) * lineLength);

                    
                    // Create and show image
                    var img = new Image();
                    img.src = '` + imgMoving + `';

                    // Draw Line
                    ctx_IMG.drawImage(img, 0, 0, ` + screenWidth + `, ` + newImgHeight + `);
                    ctx_IMG.beginPath();
                    ctx_IMG.moveTo(lineAnchor[0], lineAnchor[1])
                    ctx_IMG.lineTo(lineEND_X, lineEND_Y)
                    ctx_IMG.stroke();

                </script>

            </html>
            `;
            applyScripts(html)
        }
        
        /*
        When setting the html element using display_element.innerHTML, the scripts are not allowed to run. This function will curcumvent this (in an admittedly odd way) which will allow the scripts of the external html to run
        */
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
            function load(element, file, callback){
                console.log('used load function')
                var xmlhttp = new XMLHttpRequest();
                xmlhttp.open("GET", file, true);
                xmlhttp.onload = function(){
                    if(xmlhttp.status == 200 || xmlhttp.status == 0){ //Check if loaded
                        element.innerHTML = xmlhttp.responseText;
                        callback();
                    }
                }
                xmlhttp.send();
              }
        }

        function endTrial() {
            if (verbose) {console.log('ended trial')}

            // clear keyboard response
            jsPsych.pluginAPI.cancelKeyboardResponse(key_listener);

            // save data
            var trial_data = {
                "FinalLinePosition": linePos,
                "FaceType": trialParams.FaceType,
                "TiltDirection": trialParams.TiltDirection,
                "TubeType": trialParams.TubeType,
                "timeViewing": tEnd_Viewing - tStart_Viewing,
                "timeMoving": tEnd_Moving - tStart_Moving,
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