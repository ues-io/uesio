# Getting Started

Welcome to the **UESIO** – User Experience Studio documentation!

(u)ser (e)xperience (s)tud(io) - ues.io - (pronounced "yoo-zee-oh") is a web application builder where you work on configuration rather than code.

Add shortcuts to your development cycles, share your coding talent and profit by listing in the Bundle Store.

| Track 1: Developers                                                                                             | Track 2: Human                                                                                 |
| --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Prerequisites**: Knowledge of npm and nodejs.                                                                 | **Prerequisites**: Ability to use a web browser.                                               |
| **Description**: Build components with react, use source control. Automate building of apps. Use the Uesio CLI. | **Description**: Build apps without writing code. Configure what you want in the Uesio studio. |

# Track 1: Developers

In order to follow this track, you need to have basic knowledge of code development.

Are you ready to explore the full potential of Uesio?

### Requirements overview:

-   Uesio account at https://studio.ues-dev.io

-   Node.js 14.17.4 or later.

-   NPM 8.6.0 or later.

-   MacOS, Windows, and Linux are supported.

-   Text Editor (Visual Studio Code highly recommended).

-   Modern web browser.

# Track 2: Humans

Every day our developers try to improve Uesio so that everyone can create web applications without the need for technical knowledge.

Are you ready to accept the challenge?

### Requirements overview:

-   Uesio account at https://studio.ues-dev.io

-   Modern web browser.

-   MacOS, Windows, and Linux are supported

# Setting up your environment

Uesio invites you to code as you are. This guide will help you get set up and install what you need to start coding and accessing services to put your work into production.

1. #### Install node and npm

The first thing is to install node and npm; To carry out this operation, we recommend that you follow the steps described on its website because the steps may vary depending on the version and change over time;

Please visit the following link for more information:

https://nodejs.org/en/download/

#### 2 . Install Visual Studio Code

Once installed node and npm; We recommend that you install the text editor you feel most comfortable with. Our team uses Visual Studio Code for its countless extensions that make their lives easier. I may do yours too.
To install visual studio code on your computer we advise you to take a look at its official documentation.

https://code.visualstudio.com/

#### 3 . Install Uesio CLI

Finally, we are going to install the Uesio CLI. In this example we install the CLI globally, this is the easiest way to start using Uesio. Open a new terminal on the operating system of your choice and then enter the following command:

```console
npm install -g @uesio/cli
```

Verify that the CLI is installed correctly

```console
uesio version
```

That's it, now you are ready to have fun with Uesio!

# Create new application

Now the fun begins, let's play with Uesio!

_Note: This tutorial uses Unix commands, if you are using Windows you may need to change certain Unix commands to the Windows equivalent._

1. #### Create your project directory

We recommend that you give this directory the same name that you will give your application.

```console
mkdir <myproject>
cd <myproject>
```

2. #### Set the Host

In case you skipped the installation of the Uesio CLI look at the [Setting up your environment Install the Uesio CLI Tutorial.](https://duckduckgo.com)
If it is the first time that you use the Uesio CLI you will have to select the host where you want to connect.

To perform this operation, you need to enter the following command and select the desired host from those available in the list.

```console
uesio sethost
```

3. #### Initialize a new application

Now we are going to create our first application in Uesio, for this we only need to type the following command and answer the questions that are asked to create our first application.

```console
uesio init
```

4. #### Check the Status

Let's check the status of our application.

```console
uesio status
```

If everything has gone well, you will see a message similar to this one:

```console
Connected to host: https://studio.ues.io
Hello! User
You are a studio.standard user in the prod_studio site.
Active workspace is dev for app myproject.

```

This is all now open a new window in your browser and go to https://studio.ues.io/login, login and you will see your new changes.

# Generators

Generators help you build an entire application or just parts of an application in a fast and safe way. In this example we are going to create a new collection, but have fun playing around with other types of metadata. Uesio offers generators for each of its data types.

1. #### Run a generators

Depending on the type of generator we use, the system asks different questions, if we answer them all properly we will obtain new metadata of the desired type.

```console
uesio generate collection
```

What is a collection without any fields? Something a bit useless …
Let’s go ahead and create some fields! Depending on the type of field you chose the system will ask you different questions.
Move on and create as many fields as you need for your collection.

```console
uesio generate field
```

But that's not all, if you need a list or detail type view, simply execute the following commands and you will be able to generate a functional base for your views. Later you can make all the changes you consider necessary but this will help you to start with the views in Uesio.

```console
uesio generate listview
```

```console
uesio generate detailview
```

2. #### Deploy

Now it's time to send our changes to the server, for this it will be enough to execute a simple command and our new metadata will be sent to the server.

```console
uesio deploy
```

3. #### Preview your changes

This is all now open a new window in your browser and go to https://studio.ues.io/login, login and you will see your new changes.
