# Competing-Tube-Tilt-2
The third iteration of the competing tube tilt experiment. The first was in the PNI eye tracking lab, the second was online, this is the third. 

A online version of the Competing Tube Tilt Experiment.
The original experiment, performed in MATLAB needs to be brought online during these COVID times. So this program will do that.

The major difference between this and the OnlineCompetingTubeTilt is that the experiemnt emphazises the characters on the screeen by asking what direction 'Will' is looking at

Run me @ https://guterstam.se/OnlineTubeTilt-2/index.html

## `index.html`
- Main website to load and run the tube tilt experiment. See jsPsych.init() for details of experiment.

## `Analyze_OnlineTubeTilt.rmd` 
- A analysis script which imports and analyzes the tube tilt trial data for each participant

## [`/source/`](https://github.com/dwachtell/Competing-Tube-Tilt-2/tree/master/source)
- Contains important scripts for the experiment to work
- `ExperimentSurveys.js` is the variables that record the pre- and post-experiment surveys
- `Plugin_DavisTubeTilt.js` is the jsPsych plugin that performs the tube tilt experiment
- `davis-resize.js` is a jsPsych plugin that will ask participants to move a box in order to determine the screen size in inches
- `gatherParticipantInfo.js` is a script to gather information about the participant (ID, screen size, browser, etc.)

## [`/images/`](https://github.com/dwachtell/Competing-Tube-Tilt-2/tree/master/images)
- Contains the images needed to run the experiment
- Viewing ==> images for the viewing phase
    - In format `FaceType_ArrowDirection_TubeType`.jpg
- Moving ==> images for the moving phase
   - In format `FaceType_ArrowDirection`.jpg
- The filename is vital to the experiment, so if pictures are changed make sure to maintain the format of the filename (or change the code)

## [`/jsPsych/`](https://github.com/dwachtell/Competing-Tube-Tilt-2/tree/master/jspsych)
- Contains the jsPsych folder and workspace.
- Be extremely careful about edits to this folder, it can have drastic effects

## [`/Data/`](https://github.com/dwachtell/Competing-Tube-Tilt-2/tree/master/data)
- Contains the directory for the data files.
- `data/pInfo` contains the participant information recorded from each experiment
    * Filename = 'pInfo_TubeTilt'_Year-Month-Day-Hour-Minute-TimeZoneOffset-UniqueID
- `data/raw` contains the raw csv output from each experiment
- `data/respMats/` contains the csv response matricies for each subject

## [`/Docs/`](https://github.com/dwachtell/Competing-Tube-Tilt-2/tree/master/docs)
- Contains the pdf consent form that are available during the experiment

## `write_data.php`
 - Allows for the data to be saved to the server
 - This won't run properly on any non-server computer (probably... it requires setting a bunch of things up)
