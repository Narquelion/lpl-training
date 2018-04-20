# Week 2 Homework

## 2.1 Integrate *HW 1.1* with Firebase and Mechanical Turk

### 2.1a Getting started with Firebase

#### Firebase setup and installation

In order to use Firebase, you will need to do a few things:

1. Go to https://firebase.google.com/ and click "Get Started" to go to the console. You will need to log in with a Google account.

2. Click on "New Project". Give you project a name and an ID.

3. Install the Firebase CLI. Instructions can be found [here](https://github.com/firebase/firebase-tools). You will need to first install [Node.js](http://nodejs.org/), which installs npm; you can do this through a package manager, e.g. Homebrew or Linuxbrew, or you can download the installer from the Node.js website. After it is installed, you can then run `npm install -g firebase-tools` to install the CLI.

Next, you need to set up the project your created through the GUI so that you can make changed to it from the command line.

1. Create a directory for your project and `cd` into it.

2. Log into the CLI. You do this with the command `login`. You will be asked to login with your Google username and password.

3. Run `firebase init`. You will be asked which CLI features you want to set up; choose "Database", "Hosting", and "Storage".

4. You will be asked to set up a default project for the directory. Choose the project you just created.

5. Hit enter twice to select the default options for the next two questions, then enter "N" for the third. Finally, hit enter again to accept the default name for your storage rules.

Now your project is ready for use. You can check that it is online by going to project-name.firebaseapp.com.

Next need to do a little more housekeeping before we are actually able to integrate our code. Our experiments don't require users to be authenticated, but the default settings of Firebase only allow read/write from/to the database and storage bucket by authenticated users. In order to save data to these locations while people are doing the experiment, we must remove the need for authentication.

1. Open up `database.rules.json` in your editor of choice. It will look like this:

      {
        "rules": {
          ".read": "auth != null",
          ".write": "auth != null"
        }
      }

Edit it so that both "read" and "write" are true:

    {
      "rules": {
        ".read": true,
        ".write": true
      }
    }

2. Open `storage.rules`. It will look like this:

      service firebase.storage {
        match /b/{bucket}/o {
          match /{allPaths=**} {
            allow read, write: if request.auth!=null;
          }
        }
      }

Edit it so that both "read" and "write" are true:

      service firebase.storage {
        match /b/{bucket}/o {
          match /{allPaths=**} {
            allow read, write: if true;
          }
        }
      }

3. Run the command `firebase deploy` to push your updates to the remote project.

#### Getting your code online

Next, you will need to get your experiment online.


1. Add your hw1 files to your public directory e.g. by copy/pasting them in.

2. `firebase deploy`

3. Try going to project-name.firebaseapp.com/hw1/experiment.html and see if your experiment is there!

#### Using storage and the database in your webpage

As it is, your experiment is online and being hosted by Firebase, but it's not actually integrated with Firebase Storage or the Realtime Database. In order to actually use Firebase's features, you will need to do two things:

1. Add the appropriate includes to `experiment.html`. These are:

       <!-- Firebase includes -->

       <script src="https://www.gstatic.com/firebasejs/4.10.1/firebase-app.js"></script>
       <script src="https://www.gstatic.com/firebasejs/4.10.1/firebase-database.js"></script>
       <script src="https://www.gstatic.com/firebasejs/4.10.1/firebase-storage.js"></script>

2. Add a Firebase object to `main.js` and initialize it:

       var config = {
         apiKey: "YOUR_API_KEY_HERE",
         databaseURL: "https://PROJECT-NAME.firebaseio.com/",
         storageBucket: "gs:///PROJECT-NAME.appspot.com"
       };
       firebase.initializeApp(config);

       var storageRef = firebase.storage().ref();
       var database = firebase.database();

Your API key can be found in Settings > Project Settings.

Once you have set up your project to use the storage and database, you can use the following functions (included courtesy of me) to interact with them:

* `saveData(data_to_save, reference_to_save_location)`: Save data to the storage bucket at save_location

* `checkWorker(worker_id, database_folder)`: Check whether or not a worker is in the database

* `addWorker(worker_id, database_folder)`: Add a worker to the databaseURL

#### Debugging with Firebase

Now that your project is integrated with Firebase, you can serve it locally from the command line for testing purposes. Simply run `firebase serve` to serve the project. Typically it will be served at the address `localhost:5000`.

### 2.1b Saving data and using the Firebase database

#### Saving data

Your first task is to set up your experiment to save the data it generates to your Firebase storage bucket. This requires work in two locations:

1. hw1.main.js

In hw1.main.js, you will need to declare a variable to hold a reference to your storage location. Typically, I use the name `dataRef`. Declare this variable *outside* of any functions, e.g., at the top of the script.

In `initializeExperiment()`, you will need to set this variable. I generally include the date in the folder name to keep things organized; you can generate a date like so:

    var d = new Date();
    var date_string = [d.getFullYear(), d.getMonth() + 1, d.getDate()].join('-'); // getMonth() counts from 0; str.join() will give us a string with the format YYYY-MM-DD

When deciding on how to name the path where the data will be saved, I use the following convention: `experiment_name/(experiment_version/)date/subject-id.csv`. To actually generate a reference to the storage bucket, you must use the function `storageRef.child(full_file_path)`. This returns a reference to the specified child of the `storageRef` you declared at the top of the script. The file/intervening folders need not exist---Firebase will create them.

Putting this all together, you can generate a reference to your desired folder by adding the following code to the beginning of `initializeExperiment()`:

`dataRef = storageRef.child('experiment_name/' + date_string + '/' + experiment.getSubjectId() + '.csv');`

2. hw1.experiment.js

Once this is done, you can pass `dataRef` to `saveData()` to save data to that location. But how do you get the data out of jsPsych in the correct (CSV) format? jsPsych has this functionality built in: `jsPsych.data.get().csv()` will return all of the data generated up to that point as a CSV-formatted string.

**Your task** is to figure out where to put `saveData()` in hw1.experiment.js. HINT: You probably don't want to save just at the very end. It is never a bad thing to save more frequently!

#### Using the database

Preventing the same person from completing the experiment more than once is very important. We do this by using the Firebase Realtime Database, where we store the Worker IDs of each worker that has completed a given experiment.

##### hw1.main.js

Currently, the only thing in your `$(document).ready()` is the `attemptLoad()` function. A full main.js, however, does two things:

1. Checks if a worker is in the database already

2. Displays an error message if they are; runs the experiment if they are not.

The code looks like this; paste this into your hw1.main.js, but remember to change `study-name` to something informative!

$( document ).ready(function() {

      // checkWorker() is asynchronous. We don't want the experiment to do anything at all until it returns a value.
      // then() will fire only once checkWorker() returns.
      // checkWorker() returns a "database snapshot" which gets passed to then().

      checkWorker(jsPsych.data.urlVariables().workerId, 'study-name').then(function(snapshot) {

        if(snapshot.val() && snapshot.val().complete == 1) { // If there is a database entry for the worker, and "complete" is true
          console.log('Worker has already completed the experiment.');
          clearInterval(loadInterval); // remove the loading text
          $('#load-text').remove();
          showError(); // display an error message
        }
        else {
          console.log('Worker has not yet completed the experiment.');
          attemptLoad("resources/data/hw1.data.json"); // load the experiment
        }
      });
    });

##### hw1.experiment.js

**Your task** is to determine where in hw1.experiment.js to call the `addWorker()` function. HINT: You don't want to add someone to the database until they've finished the experiment!

### 2.1c The Mechanical Turk ad page

HITs (Human Intelligence Tasks) on Mechanical Turk consist of single, embedded HTML pages. They're unreliable and ill-suited to complex tasks, which is why we host our experiments externally. But we still need to actually get our subjects to the experiment, and we also need to be able to pay then when they finish---that's where Mechanical Turk comes in.

Using the provided template, write up an ad page for your experiment. At a minimum, you should give it a short, useful title and a brief description that tells subjects about the kind of tasks they will perform during the experiment. (But don't make it so detailed that they come in with any biases regarding how to respond!)

You will also need to edit the URL in the ad page, which currently points to language-processing-lab.firebaseapp.com/templates/basic/experiment.html, so that it points to where your experiment is hosted.

### 2.1d The survey code

You might notice that the ad page asks for a survey code. This is what workers enter once they have completed the experiment, as proof that they have finished (and because Mechanical Turk requires there be at least one form field in a HIT). At the moment, your experiment doesn't provide a code; to do this, you will need to edit the `initializeExperiment()` function in `hw1.main.js` as follows:

    jsPsych.init({
      timeline: experiment.getTimeline(),
      show_progress_bar: true,
      preload_images: images,
      display_element: 'jspsych-target',
      on_finish: function() {
        var code = jsPsych.data.getLastTrialData().values()[0].code;
        $('#jspsych-target').html('<p class="lead">You have finished the experiment! Your responses have been saved.</p>' +
            '<p>Your survey code is <b>' + code + '</b>. Please enter this code into your HIT. ' +
            'You may then close this window.</p><p>If you have any questions or concerns, ' +
            'please do not hesitate to contact the lab at <a href="mailto:uchicagolanglab@gmail.com">uchicagolanglab@gmail.com</a>.</p>');
      }
    });

    var code = 'TURK' + jsPsych.randomization.randomID(10);

### 2.1d Testing

Use the Mechanical Turk Sandbox to test your experiment. You can use the lab credentials to do this (provided in the lesson). You will want to check for a few things:

1. Is the ad page informative?
2. Does the link in the ad page lead to the experiment?
3. Are you able to proceed through the entire experiment and obtain a survey code?
4. Are you able to submit the HIT and see it in your batch results?
5. Does the data from the experiment get saved to your Firebase project?
6. Does the worker ID appear in your Firebase database?

## 2.2: Use the Mechanical Turk Sandbox to test your trials from HW 1.2

Moved to next week!

## 2.3: Write a Python script to clean the resulting data

Moved to next week!
