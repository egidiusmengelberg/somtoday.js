const Somtoday = require('./Somtoday')

let som = new Somtoday()

// enter your somtoday details here and run the program
const username = 'yourusername';
const password = 'yourpassword'
const uuid = 'yourschoolsuuid'

// get a list of all the available organisations
// you can use these to find out your schools uuid
Somtoday.getOrganisations()
  .then(organisations => console.log(organisations))

som.authenticate(uuid, username, password)
  .then(response => {
    // set the necessary propterties
    som.access_token = response.access_token
    som.refresh_token = response.refresh_token
    som.api_endpoint = response.api_endpoint

    // get new tokens based on your refresh_token (every access_token is valid for 1 hour!)
    // som.refresh()
    
    // get a list of students (for pupils this will only be yourself)
    // this also returns your id which can be used to get your grades
    som.students()
      .then(student => console.log(student))
      .catch(error => console.log('Oops, an error occured while fetching students: ' + error))

    // get a list of grades (I currently have none. which means I have no idea if this method works)
    som.grades(1, 5)
      .then(grades => console.log(grades))
      .catch(error => console.log('Oops, an error occured while fetching grades: ' + error))

    // get a list of appointments between 2 dates
    som.schedule('2020-09-21', '2020-09-25')
      .then(appointments => console.log(appointments))
      .catch(error => console.log('Oops, an error occured while fetching schedule: ' + error))

    // get a list of homework assignments on and after the selected date
    som.homework('2020-09-21')
      .then(assignments => console.log(assignments))
      .catch(error => console.log('Oops, an error occured while fetching homework: ' + error))
  })
  .catch(error => console.log('Oops, an error occured during authentication: ' + error))