# Todo List API

A RESTful API for managing todo items with user authentication, built with Express.js and MySQL.

## Features

- User authentication with JWT
- CRUD operations for todo items
- Pagination for listing todo items
- Input validation
- Error handling
- Secure password storage with bcrypt

## Tech Stack

- Node.js
- Express.js
- MySQL
- JSON Web Tokens (JWT)
- Bcrypt

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login a user
- `GET /auth/profile` - Get user profile (protected)

### Todo Items

- `GET /items` - Get all todo items (with pagination)
- `GET /items/:id` - Get a specific todo item
- `POST /items` - Create a new todo item
- `PUT /items/:id` - Update a todo item
- `DELETE /items/:id` - Delete a todo item

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MySQL

### Installation

1. Clone the repository: