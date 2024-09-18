const express = require('express')
const app = express()

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const path = require('path')
const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null

let intializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('server is running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB error : ${e.message}`)
    process.exit(1)
  }
}

intializeDBAndServer()

let hasPriorityAndStatus = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

let hasPriority = requestQuery => {
  return requestQuery.priority !== undefined
}

let hasStatus = requestQuery => {
  return requestQuery.status !== undefined
}

//API 1

app.get('/todos/', async (request, response) => {
  const {search_q = '', priority, status} = request.query
  let getTodoQuery
  switch (true) {
    case hasPriorityAndStatus(request.query):
      getTodoQuery = `
        SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority = "${priority}" AND status = "${status}";
      `
      break
    case hasPriority(request.query):
      getTodoQuery = `
        SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority = "${priority}";
      `
      break
    case hasStatus(request.query):
      getTodoQuery = `
        SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status = "${status}";
      `
      break
    default:
      getTodoQuery = `
        SELECT * FROM todo WHERE todo LIKE '%${search_q}%';
      `
  }

  const dbResponse = await db.all(getTodoQuery)

  response.send(dbResponse)
})

//API 2

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const getTodoQuery = `
      SELECT * FROM todo WHERE id = ${todoId};
    `
  const dbresp = await db.get(getTodoQuery)
  response.send(dbresp)
})

//API 3

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const postTodoQuery = `
  INSERT INTO
    todo (id, todo, priority, status)
  VALUES
    (${id}, '${todo}', '${priority}', '${status}');`
  await db.run(postTodoQuery)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updateColumn = ''
  const requestBody = request.body
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break
    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break
    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
      break
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`
  const previousTodo = await db.get(previousTodoQuery)

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}'
    WHERE
      id = ${todoId};`

  await db.run(updateTodoQuery)
  response.send(`${updateColumn} Updated`)
})

//API 5
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `
    DELETE FROM todo WHERE id - ${todoId};
  `
  await db.run(deleteQuery)
  response.send('Todo Deleted')
})

module.exports = app
