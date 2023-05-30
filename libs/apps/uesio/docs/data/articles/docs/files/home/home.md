# Introduction

###### Learn to build and deploy apps with ues.io

Welcome to ues.io documentation site. This article will give an explanation of what ues.io is and why we built it.

## What is ues.io?

Ues.io is a general purpose, [declarative](), application development platform for the web. Instead of writing code in a programming language to define the behavior of your apps, most common patterns in ues.io can be accomplished through declarative configuration. We call these individual pieces of configuration **application metadata**. Each piece of application metadata describes a portion of the functionality of your application.

At it's core, ues.io is a high-level language of patterns for describing web applications. Just like in a spoken language where words and phrases can be combined in unique ways to communicate thoughts and ideas, ues.io's metadata types (or patterns) can be combined in unique ways to dscribe the complete functionality of an app.

The ues.io platform can be split into the following four main conceptual areas.

### 1. The Metadata Specification

Routes, Views, Files, Collections, Secrets, Profiles, etc. These are some of the different abstractions that ues.io provides for you to describe your app. Each of these metadata types can have many properties and options for configuration. We think that using these concepts is an intuitive way to build and think about web applications. For more information about each individual metadata type, check out the **metadata types** section of the documentation.

### 2. The Runtime

Unlike some application platforms, ues.io does not compile your application configuration into traditional code. Instead, the ues.io runtime interprets your configuration on-the-fly to run your app. That's how we can show you the results of configuration changes instantaneously without a slow compilation step.

### 3. The Studio

The ues.io studio is where you build and administer your apps. This is your graphical user interface into the ues.io language and platform. One of the most important parts of the ues.io studio is the view builder. The [view]() builder is where you assemble [components]() together to build interfaces and connect to you data in [collections]() through [wires]().

### 4. The Command Line Interface

It is often useful to interact with your apps programmatically or through a command line interface. That's why we created the ues.io CLI. The CLI makes it easy to manage your changes in a source control system like git, and automate tests and deployments. Many of the things you can do in the ues.io studio, you can also do through the ues.io CLI.

## Why we built ues.io

From the start, the web was created with [declarative]() languages like HTML and CSS. However, over time the web began to transition from being primarily a platform for static, linked documents to a platform for dynamic applications. The primary driver of this change was the addition of Javascript. This allowed the web to deliver all kinds of dynamic and engaging content. More and more software applications were moved from desktop environments into browser-based, web environments.

Although this transition had many benefits, it also made developing web applications much more difficult and complicated. Should you render server-side or client-side, which bundler should you use? Which component lifecycle framework? What about a styling library? How should you store state? What about your persistence layer? Database indexes? What if I need to scale? There are so many difficult and important decisions to make when developing web applications and these examples only scratch the surface.

These questions are truly important and require thought, but should they really be necessary for everyone who just wants to build a web app? We set out to build a platform where you could think mostly about _what_ your application does, instead of _how_ it does it. You should be able to think in higher-level abstractions like views and components and leave the technical implementation details to the platform. We want to make using common application patterns and following best practices simple and straightforward.

This all sounds great, but there's still one big problem. Declarative programming works well for common patterns and straightforward processes. But what happens when you want to do something truly unique or sufficiently complex? In these cases, trying to take the declarative approach will often be impossible or just make things even more complicated. With ues.io, we've built in extension points to our language where you can build your own abstractions, with code.

## Get Started

1. Create a [ues.io account](create-account).
2. Create your [first app](first-app).
3. Deploy your [app to a site](deploy-to-site).
