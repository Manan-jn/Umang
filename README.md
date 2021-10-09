# Umang- A Self-Transformation Journey

##Description:
Umang is a web application that allows users to record their current mood by facial recognition and recommend yoga postures and music all curated based on the indivisual's mood. It also provides the user to evaluate the correctness of their yoga posture and also has a journaling page for the user to jot doen their emotions and thoughts.
The goal of Umang is to help fight the stigma associated with mental health by get people talking and offer a chance to the user to connect with themselves and improve their mental health.
This project is currently in active development, as part of Hackharvard

##Feature List:
-Record mood through facial recognition
-Recommended music playlist based on mood
-Recommendations of yoga postures
-Evaluate correctness of yoga posture
-Self care Journal

##Technical Aspect:

This Project is mainly divided into 2 parts i.e frontend,backend part. Let's discuss each one of them in detail.

###Frontend Part- It mainly involves in collecting the image of the user firstly to detect the emotions and then the posture of yoga from front cam which is used for pose identification. This image is passed to posenet model which is pretrained in ml5.js and get the countor part locations x and y and save them for getting the data in form of json. We will be getting 17 poses detected from the image which has 2 values associated with it which will be in total 34 cordinates. Now once the data is converted we need to make use of pandas to convert to data frame and we need to train it with the KNN classifier and pickle it. The coordinates fro output is sent as request to flask app from ajax request.For getting the front cam i used p5.js.

###Backend Part- Now coming to backend part we used flask as a backend micro frame work to accept the request from front ed java script.Now we need to unpickle the model and predict with the request values which are in form of form values and predict the results and send the response to ajax there by we can get the pose identified.

# Umang
