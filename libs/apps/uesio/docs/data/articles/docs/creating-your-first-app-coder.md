# Create new application

Now the fun begins, let's play with Uesio!

_Note: This tutorial uses Unix commands, if you are using Windows you may need to change certain Unix commands to the Windows equivalent._

1. #### Create your project directory

We recommend that you give this directory the same name that you will give your application.

```bash
mkdir <myproject>
cd <myproject>
```

2. #### Set the Host

In case you skipped the installation of the Uesio CLI look at the [Setting up your environment Install the Uesio CLI Tutorial.](https://duckduckgo.com)
If it is the first time that you use the Uesio CLI you will have to select the host where you want to connect.

To perform this operation, you need to enter the following command and select the desired host from those available in the list.

```bash
uesio sethost
```

3. #### Initialize a new application

Now we are going to create our first application in Uesio, for this we only need to type the following command and answer the questions that are asked to create our first application.

```bash
uesio init
```

4. #### Check the Status

Let's check the status of our application.

```bash
uesio status
```

If everything has gone well, you will see a message similar to this one:

```bash
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

```bash
uesio generate collection
```

What is a collection without any fields? Something a bit useless …
Let’s go ahead and create some fields! Depending on the type of field you chose the system will ask you different questions.
Move on and create as many fields as you need for your collection.

```bash
uesio generate field
```

But that's not all, if you need a list or detail type view, simply execute the following commands and you will be able to generate a functional base for your views. Later you can make all the changes you consider necessary but this will help you to start with the views in Uesio.

```bash
uesio generate listview
```

```bash
uesio generate detailview
```

2. #### Deploy

Now it's time to send our changes to the server, for this it will be enough to execute a simple command and our new metadata will be sent to the server.

```bash
uesio deploy
```

3. #### Preview your changes

This is all now open a new window in your browser and go to https://studio.ues.io/login, login and you will see your new changes.
