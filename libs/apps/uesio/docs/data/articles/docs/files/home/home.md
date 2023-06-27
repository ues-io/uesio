# Introduction

##### Learn to build and deploy apps with ues.io

Welcome to ues.io! This article will explain what ues.io is and why we built it.

## What is ues.io?

Ues.io is a general purpose, [declarative](declarative-app-development), application development platform for the web. Instead of writing code in a programming language to define the behavior of your apps, most common patterns in ues.io can be accomplished through declarative configuration. We call these individual pieces of configuration **application metadata**. Each piece of application metadata describes a portion of the functionality of your application.

At its core, ues.io is a high-level language of patterns for describing web applications. Just like in a spoken language where words and phrases can be combined in unique ways to communicate thoughts and ideas, ues.io's metadata types (or patterns) can be combined in unique ways to describe the complete functionality of an app.

The ues.io platform can be split into the following four main conceptual areas.

### 1. The metadata specification

Routes, Views, Files, Collections, Secrets, Profiles, etc. These are some of the different abstractions that ues.io provides for you to describe your app. Each of these metadata types can have many properties and options for configuration. We think that using these concepts is an intuitive way to build and think about web applications. For more information about each individual metadata type, check out the **metadata types** section of the documentation.

### 2. The runtime

Unlike some application platforms, ues.io does not compile your application configuration into traditional code. Instead, the ues.io runtime interprets your configuration on-the-fly to run your app. That's how we can show you the results of configuration changes instantaneously without a slow compilation step.

### 3. The studio

The ues.io studio is where you build and administer your apps. This is your graphical user interface into the ues.io language and platform. One of the most important parts of the ues.io studio is the view builder. The [view](views) builder is where you assemble [components](components) together to build interfaces and connect to you data in [collections](collections) through [wires](wires).

### 4. The command line interface

It is often useful to interact with your apps programmatically or through a command line interface. That's why we created the ues.io CLI. The CLI makes it easy to manage your changes in a source control system like git, and automate tests and deployments. Many of the things you can do in the ues.io studio, you can also do through the ues.io CLI.

## Why we built ues.io

From the start, the web was created with [declarative](declarative-app-development) languages like HTML and CSS. However, over time the web began to transition from being primarily a platform for static, linked documents to a platform for dynamic applications. The primary driver of this change was the addition of Javascript. This allowed the web to deliver all kinds of dynamic and engaging content. More and more software applications were moved from desktop environments into browser-based, web environments.

Although this transition had many benefits, it also made developing web applications much more difficult and complicated. To build and operate a traditional web application today requires a deep understanding of a wide range of backend and frontend tools and frameworks. Each time a developer goes to build a web app, they must answer a lot of questions:

-   Should I render server-side or client-side?
-   Which bundler should I use?
-   Which component lifecycle framework should I pick?
-   Should I build my own components with the framework, or use someone else's library?
-   Do I need a styling library?
-   How should I store state?
-   What persistence layer? Do I need database indexes?
-   Do I need tests? What kind? How many? What testing frameworks and libraries should I use?
-   How do I compile my app? Do I need containers?
-   How do I run the app? Where? What cloud?
-   How do I scale, monitor, and manage the deployed app?

There are so many difficult and important decisions to make when developing web applications, and these examples only scratch the surface.

These questions are truly important and require thought, but should they really be necessary for everyone who just wants to build a web app?

## It's time to shift UP

We strongly believe that the answer is _no_ - our industry needs tools that let developers work at a higher level of abstraction.

We set out to build a platform that is **declarative** as its core, so that you can think mostly about _what_ your application does, instead of _how_ it does it. You should be able to think in higher-level abstractions like collections, fields, views, routes, and components, and leave the technical implementation details to the platform. We want to make using common application patterns and following best practices simple and straightforward.

This all sounds great, but there's still one big problem. Declarative programming works well for common patterns and straightforward processes. But what happens when you want to do something truly unique or sufficiently complex?

Every software abstraction, in every domain, has its limits. In these cases, trying to take the declarative approach will often be impossible or just make things even more complicated. If an abstraction is worth using, it should make most tasks in its domain (the "90%") simple, but still provide an "escape hatch" for developers to achieve the tasks that the abstraction doesn't (yet) support (the "10%").

With ues.io, we've built in extension points to our language where you can build your own abstractions, with code, while still retaining the ability to interact with these extensions using declarative patterns, so that the 10% is still possible.

## Get Started

1. Create a [ues.io account](create-account).
2. Create your [first app](first-app).
3. Deploy your [app to a site](deploy-to-site).
