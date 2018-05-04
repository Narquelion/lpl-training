/** Construct an instance of the Experiment class.
  * @constructor
  * @param {Object} params - The experiment parameters from URL data and/or your data.json file.
  */
function Experiment(params) {

  /** Hold the trials, instructions, etc. that make up the experiment.
   * @type {Array<object>}
   */
  var timeline = [];

  /** The current subject.
   * @type {object}
   * @param {string} id - The subject's Worker ID or SONA subject number.
  */
  var subject = { //NOTE: Add more subject parameters here if needed.
    id: params.workerId
  }

  /** Return the subject's ID.
   * @returns {string} - The subject's Worker ID or SONA subject number.
  */
  this.getSubjectId = function() {
    return subject.id;
  }

  /** Return the experiment timeline.
   * @returns {array} - The experiment timeline.
  */
  this.getTimeline = function() {
    return timeline;
  }

  /** Add data to jsPsych's internal representation of the experiment. Can be called at any time.
  */
  this.addPropertiesTojsPsych = function () {
    jsPsych.data.addProperties({
      workerId: subject.id
    });
  }

  /** Initialize and append the default preamble to the timeline.
    * This includes a generic intro page, consent form, and demographic questionnaire.
    * Values for some of these are altered via the JSON file.
  */
  var initPreamble = function() {
    var preamble = params.preamble;

    // NOTE: Functions cannot be included in JSON files - must be appended here instead.

    /* This function checks whether or not the subject consented to the experiment.
     * jsPsych uses the return value (true/false) to determine whether or not to
     * display the conditional trial. True -> display the trial. False -> continue
     * the experiment.
    */
    preamble.consent_check.conditional_function = function() {
      var data = jsPsych.data.get().last(1).values()[0];
      return !data.consented;
    }

    // Check that the participant entered a valid age.
    preamble.demographics_check.conditional_function = function() {
      var data = jsPsych.data.get().last(1).values()[0];
      console.log(data);
      if(parseInt(data.age) < 18) return true;
      return false;
    }

    // Add the preamble to the timeline
    timeline = timeline.concat([preamble.intro, preamble.consent, preamble.consent_check, preamble.demographics, preamble.demographics_check, preamble.post_demographics]);
  }

  /** This function handles setting up the experimental trials.
  */
  var initTrials = function() {

    var trial_stims = [];
    _.each(params.stimuli, function(stimulus) {
      trial_stims = trial_stims.concat(jsPsych.randomization.factorial(stimulus, 1));
    });

    trial_stims = jsPsych.randomization.shuffle(trial_stims);

    var trials = [];

    _.each(trial_stims, function(trial, i) {

      console.log(trial);

      var img_name = trial.img_name == undefined ? trial.object : trial.img_name;
      var img = '<p class="text-center"><img src="resources/images/' + img_name + trial.scale_point + '.jpg" max-width="400"></img></p>';
      var preamble = '<p class="text-center">This is a(n) ' + trial.adjective + ' ' + trial.object + '.</p>';
      var scale = ["1 (completely disagree)", "2", "3", "4", "5 (completely agree)"];

      trials.push({
        type: 'survey-likert',
        preamble: preamble,
        questions: [{prompt: img, labels: scale, required: true}],
        button_label: 'Next >'
      });
    });

    timeline = timeline.concat(trials);
  }

  /** Build the experiment.
  */
  this.createTimeline = function() {
    initPreamble();
    initTrials();
  }
};
