const axios = require('axios');
const qs = require('querystring')

const organisations_url = 'https://servers.somtoday.nl/organisaties.json';
const base_url = 'https://production.somtoday.nl';

const auth_token = 'RDUwRTBDMDYtMzJEMS00QjQxLUExMzctQTlBODUwQzg5MkMyOnZEZFdkS3dQTmFQQ3loQ0RoYUNuTmV5ZHlMeFNHTkpY'

class Somtoday {

  // public properties for the acces_token, refresh_token and api_endpoint
  access_token
  refresh_token

  api_endpoint

  user_id

  // get a list of organisations using somtoday
  static getOrganisations() {
    return axios.get(organisations_url)
      .then(response => {
        let organisations = []

        response.data[0]['instellingen'].forEach((organisation) => {
          organisations.push({
            uuid: organisation.uuid,
            name: organisation.naam,
            location: organisation.plaats
          })
        })

        return Promise.resolve(organisations)
      })
      .catch(error => Promise.reject(error))
  }

  // get tokens to authenticate the user
  authenticate(uuid, username, password) {

    let reqData = {
      grant_type: 'password',
      username: uuid + '\\' + username,
      password: password,
      scope: 'openid'
    }

    let headers = {
      headers: {
        'Authorization': `Basic ${auth_token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }

    return axios.post(base_url + '/oauth2/token', qs.stringify(reqData), headers)
      .then(response => {
        return Promise.resolve({
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token,
          api_endpoint: response.data.somtoday_api_url,
          tenant: response.data.somtoday_tenant,
          expires_in: response.data.expires_in
        })
      })
      .catch(error => Promise.reject(error))
  }

  // refresh the users authetication token
  refresh() {

    if (!this.refresh_token) {
      return Promise.reject('The refresh_token has to be set to get a new access_token')
    }

    let reqData = {
      grant_type: 'refresh_token',
      refresh_token: this.refresh_token
    }

    let headers = {
      headers: {
        'Authorization': `Basic ${auth_token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }

    return axios.post(base_url + '/oauth2/token', qs.stringify(reqData), headers)
      .then(response => {
        return Promise.resolve({
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token,
          api_endpoint: response.data.somtoday_api_url,
          tenant: response.data.somtoday_tenant,
          expires_in: response.data.expires_in
        })
      })
      .catch(error => Promise.reject(error))
  }

  // get all students
  students() {

    if (!this.access_token || !this.api_endpoint) {
      return Promise.reject('You must set an access_token and api_endpoint to use this method. read the docs for more info.')
    }

    let headers = {
      headers: {
        'Authorization': 'Bearer ' + this.access_token,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }

    return axios.get(this.api_endpoint + '/rest/v1/leerlingen', headers)
      .then(response => {
        let students = []

        response.data.items.forEach((student) => {
          
          let gender

          switch(student.geslacht) {
            case 'Man':
              gender = 'male'
              break;
            case 'Vrouw':
              gender = female
              break;
            default:
              gender = 'undefined'
          }
          
          students.push({
            uuid: student.UUID,
            id: student.links[0].id,
            school_id: student.leerlingnummer,
            firstname: student.roepnaam,
            lastname: student.achternaam,
            email: student.email,
            birthday: student.geboortedatum,
            gender: gender
          })
        })
        return Promise.resolve(students)
      })
      .catch(error => Promise.reject(error))
  }

  // get student by id
  student(id) {
    if (!this.access_token || !this.api_endpoint) {
      return Promise.reject('You must set an access_token and api_endpoint to use this method. read the docs for more info.')
    }

    if (!this.user_id && !id) {
      return Promise.reject('You must set an user_id or id to use this method. read the docs for more info.')
    }

    if (!id && this.user_id) {
      id = this.user_id
    }

    let headers = {
      headers: {
        'Authorization': `Bearer ${this.access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }

    return axios.get(this.api_endpoint + '/rest/v1/leerlingen/' + id, headers)
    .then(response => {

      let gender

      switch(response.data.geslacht) {
        case 'Man':
          gender = 'male'
          break;
        case 'Vrouw':
          gender = female
          break;
        default:
          gender = 'undefined'
      }
        
     let student = {
        uuid: response.data.UUID,
        id: response.data.links[0].id,
        school_id: response.data.leerlingnummer,
        firstname: response.data.roepnaam,
        lastname: response.data.achternaam,
        email: response.data.email,
        birthday: response.data.geboortedatum,
        gender: gender
      }

      return Promise.resolve(student)
    })
      .catch(error => Promise.reject(error))
  }

  // get grades
  grades(lowerBound, upperBound) {
    if (!this.access_token || !this.api_endpoint) {
      return Promise.reject('You must set an access_token and api_endpoint to use this method. read the docs for more info.')
    }

    let headers = {
      headers: {
        'Authorization': `Bearer ${this.access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    }

    if (lowerBound && upperBound) {
      headers.headers.Range = 'items=' + lowerBound + '-' + upperBound
    }

    return axios.get(this.api_endpoint + '/rest/v1/resultaten/huidigVoorLeerling/' + this.user_id, headers)
      .then(response => Promise.resolve(response.data))
      .catch(error => Promise.reject(error))
  }

  // get schedule based on begin and end date
  schedule(begin, end, sort='asc-id') {
    if (!this.access_token || !this.api_endpoint) {
      return Promise.reject('You must set an access_token and api_endpoint to use this method. read the docs for more info.')
    }

    let headers = {
      headers: {
        'Authorization': `Bearer ${this.access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    }

    let params = {
      sort: sort,
      begindatum: begin,
      einddatum: end,
      additional: ['vak', 'docentAfkortingen', 'leerlingen'],
    }
 
    return axios.get(this.api_endpoint + '/rest/v1/afspraken?' + qs.stringify(params), headers)
      .then(response => {
        let appointments = []

        response.data.items.forEach((appointment) => {
          
          appointments.push({
            begin: appointment.beginDatumTijd,
            end: appointment.eindDatumTijd,
            begin_period: appointment.beginLesuur,
            end_period: appointment.eindLesuur,
            title: appointment.titel,
            description: appointment.omschrijving,
            classroom: appointment.locatie,
            presence_required: appointment.presentieRegistratieVerplicht,
            presence_processed: appointment.presentieRegistratieVerwerkt,
            location: appointment.vestiging.naam,
            type: appointment.afspraakType.naam,
            presence: appointment.afspraakType.activiteit
          })
        })
        return Promise.resolve(appointments)
      })
      .catch(error => console.log(error))
  }

  // get homework by date
  homework(date) {
    if (!this.access_token || !this.api_endpoint) {
      return Promise.reject('You must set an access_token and api_endpoint to use this method. read the docs for more info.')
    }

    let headers = {
      headers: {
        'Authorization': `Bearer ${this.access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    }

    let params = {
      begintNaOfOp: date
    }
 
    return axios.get(this.api_endpoint + '/rest/v1/studiewijzeritemafspraaktoekenningen?' + qs.stringify(params), headers)
      .then(response => {
        let assignments = []

        response.data.items.forEach((assignment) => {
          
          assignments.push({
            title: assignment.studiewijzerItem.onderwerp,
            description: assignment.studiewijzerItem.omschrijving,
            attachments: assignment.studiewijzerItem.bijlagen,
            class: assignment.lesgroep.naam,
            subject: assignment.lesgroep.vak.naam,
            created_at: assignment.aangemaaktOpDatumTijd,
            due_at: assignment.datumTijd,
            school_year: assignment.lesgroep.schooljaar.naam,
            show: assignment.studiewijzerItem.tonen,
            for_exam_file: assignment.lesgroep.examendossierOndersteund,
          })
        })
        return Promise.resolve(assignments)
      })
      .catch(error => Promise.reject(error))
  }

}

module.exports = Somtoday
