const Alexa = require('ask-sdk-core');
const i18n = require('i18next');

const states = {
  START: "start",
  QUIZ: "quiz",
};
const chords = ["A", "B", "C", "D", "E", "F", "G"];
const chordTypes = ["major", "minor", "major seventh", "minor seventh", "augmented", "diminished"];
const appName = "Ukulele ear trainer";

// when skill launches, provide instructions for the skill
const LaunchHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    // checks request type
    return request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    //const speakOutput = "Hello, and welcome to " + appName + ". You can say 'test me' to begin a testing session.";
    const speakOutput = audioFileTestSpeakOutput();
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    sessionAttributes.state = states.START;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

const TestAnswerHandler =  {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        return request.type === 'IntentRequest' && request.intent.name === 'TestAnswerIntent' && sessionAttributes.state === states.QUIZ;
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        let slotValues = getSlotValues(request.intent.slots);

        let speakOutput = "";
        if (slotValues.chord_type.heardAs) {
            if(slotValues.chord_type.heardAs === sessionAttributes.correctAnswer) {
              speakOutput = "Correct!";
            }
            else {
              speakOutput = "Incorrect. The answer was " + sessionAttributes.correctAnswer + ".";
            }
            return randomChordQuiz(handlerInput, speakOutput);
        }
        speakOutput = "please try again, say either major, major seventh, minor, minor seventh, diminished, or augmented"

        return responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    },
};

const TestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === "TestIntent";
  },
  handle(handlerInput) {
    return randomChordQuiz(handlerInput, "");
  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const speakOutput = appName + " tests you on your ability to identify major, major seventh, minor, minor seventh, diminished, or augmented chords played on an ukulele. Say test me to start a test.";
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

const FallbackHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    let speakOutput = "I'm sorry, " + appName + " doesn't recognize that. Please try again.";
    if(sessionAttributes.state === states.QUIZ) {
      speakOutput = "Please try again. Say either major, major seventh, minor, minor seventh, diminished, or augmented.";
    }
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const speakOutput = "Good bye!";
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    console.log(`Error stack: ${error.stack}`);
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const speakOutput = "Sorry, an error occurred with " + appName + ".";
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

function randomChordQuiz(handlerInput, resultFromPreviousQuiz) {

  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  sessionAttributes.state = states.QUIZ;

  const correctChordType = getRandomChordType();
  sessionAttributes.correctAnswer = correctChordType;

  const speakOutput = (resultFromPreviousQuiz === "" ? "" : resultFromPreviousQuiz + " ") + "Name this chord. " + getRandomChordAudioAsSpeechString(correctChordType);

  return handlerInput.responseBuilder
    .speak(speakOutput)
    .reprompt(speakOutput)
    .getResponse();
}
//'<audio src="https://alexa-musical-ear-trainer-bucket-123.s3.amazonaws.com/C_Chord_Ukulele_1.mp3" />
function getRandomChordAudioAsSpeechString(chordType) {
  return '<audio src="' + getRandomAudioFileLink(chordType) + '" />'
}
function getRandomAudioFileLink(chordType) {
  let convertedChordURIFriendly = chordType.replace(" ", "_");
  return "https://alexa-musical-ear-trainer-bucket-123.s3.amazonaws.com/" + getRandomNote() + "_" + convertedChordURIFriendly + "_Chord_Ukulele.mp3";
}

function audioFileTestSpeakOutput() {
  let speak = "This is a test. ";
  let num = 0;
  for(let i = 0; i < chords.length; i ++) {
    for(let j = 0; j < chordTypes.length; j ++) {
      num += 1;
      let convertedChordURIFriendly = chordTypes[j].replace(" ", "_");
      let audioLink = "https://alexa-musical-ear-trainer-bucket-123.s3.amazonaws.com/" + chords[i] + "_" + convertedChordURIFriendly + "_Chord_Ukulele.mp3";
      let audio = '<audio src="' + audioLink+ '" />';
      speak += "Test, " + audio + " ";
      break;
    }
    break;
  }
  speak += "End test. " + num + " chords tested.";
  return speak;
}

function getRandomNote() {
  return chords[Math.floor(Math.random() * chords.length)];
}

function getRandomChordType() {
  return chordTypes[Math.floor(Math.random() * chordTypes.length)];
}

// Obtained the code for this function from https://s3.amazonaws.com/webappvui/skillcode/v2/index.html
function getSlotValues(filledSlots) {
    const slotValues = {};

    Object.keys(filledSlots).forEach((item) => {
        const name  = filledSlots[item].name;

        if (filledSlots[item] &&
            filledSlots[item].resolutions &&
            filledSlots[item].resolutions.resolutionsPerAuthority[0] &&
            filledSlots[item].resolutions.resolutionsPerAuthority[0].status &&
            filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
            switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
                case 'ER_SUCCESS_MATCH':
                    slotValues[name] = {
                        heardAs: filledSlots[item].value,
                        resolved: filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name,
                        ERstatus: 'ER_SUCCESS_MATCH'
                    };
                    break;
                case 'ER_SUCCESS_NO_MATCH':
                    slotValues[name] = {
                        heardAs: filledSlots[item].value,
                        resolved: '',
                        ERstatus: 'ER_SUCCESS_NO_MATCH'
                    };
                    break;
                default:
                    break;
            }
        } else {
            slotValues[name] = {
                heardAs: filledSlots[item].value,
                resolved: '',
                ERstatus: ''
            };
        }
    }, this);

    return slotValues;
}


const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchHandler,
    TestHandler,
    TestAnswerHandler,
    HelpHandler,
    ExitHandler,
    FallbackHandler,
    SessionEndedRequestHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .withCustomUserAgent('sample/basic-fact/v2')
  .lambda();