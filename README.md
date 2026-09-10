# Draftflow

Draftflow is a modern content management system designed for creating, managing, publishing, and monitoring website content from a centralized administrative dashboard.

It separates content management from the public-facing website, allowing articles and related data to be maintained independently and delivered dynamically to the frontend.

Draftflow was initially implemented for **The Compass**, where it serves as the content management layer for the organization's website.

## Live Demo

A deployed version of Draftflow is available here:

https://draftflow-indol.vercel.app/

For portfolio and demonstration purposes, a demo administrator account may be provided with restricted permissions.

**Demo Account**

Email: `admin@example.com`
Password: `admin123`

The demo account should only be used for exploring the interface and available CMS features.

## Overview

Draftflow provides an administrative environment for managing digital content without directly modifying the public website.

Through the CMS, administrators can manage articles, control publication status, review content performance, and monitor website activity.

The project is built around a structured content workflow that connects the administrative dashboard, database, authentication system, and public-facing website.

## Features

### Content Management

Draftflow provides tools for managing article content throughout its lifecycle.

* Create and edit articles
* Save articles as drafts
* Publish content
* Manage publication status
* Store article data and metadata
* Retrieve published content dynamically
* Maintain content independently from the frontend website

### Dashboard

The administrative dashboard provides an overview of content and website activity, including:

* Total articles
* Published articles
* Draft articles
* Total article views
* Top-performing articles
* Visitor locations by country

### Authentication

Draftflow includes authentication for securing access to the administrative interface.

Administrative functionality is separated from the public-facing website so that content management tools remain available only to authorized users.

### Dynamic Content Delivery

Published content is stored within the CMS database and retrieved dynamically by the public website.

This allows articles and other content to be updated without requiring direct modifications to the frontend application.

### Analytics

Draftflow includes basic content and visitor analytics, including:

* Article views
* Content performance
* Most-viewed articles
* Visitor countries

## The Compass Integration

**The Compass** serves as Draftflow's initial implementation.

Draftflow manages the website's article content through a separate administrative system, while The Compass retrieves and displays published content on its public-facing website.

This allows the CMS and the website to operate as separate components of the same content ecosystem.

## Technology Stack

### Application

* Next.js
* TypeScript
* Tailwind CSS

### Backend and Database

* Supabase
* PostgreSQL

### Services

* Supabase Authentication
* Supabase Database

## Architecture

Draftflow follows a CMS-based architecture where content administration and content presentation are separated.

The general content flow is:

**Administrator → Draftflow CMS → Database → API/Data Layer → Public Website**

Administrators manage content through Draftflow. The content is stored in the database and made available to the public-facing website, where it is rendered dynamically for visitors.

## Current Scope

Draftflow currently focuses on article-based content management and the supporting administrative tools required to manage and monitor content.

The architecture can be expanded to support additional functionality such as media management, content categories, publishing workflows, enhanced analytics, and additional content types.

## Project Status

Draftflow is currently under active development.

Features, interfaces, database structures, and system architecture may continue to evolve as the project expands.
