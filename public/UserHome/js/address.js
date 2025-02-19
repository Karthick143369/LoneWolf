function validateAddress() {
  const street = document.getElementById('street').value.trim()
  const city = document.getElementById('city').value.trim()
  const pinCode = document.getElementById('pinCode').value.trim()
  const state = document.getElementById('state').value.trim()
  const country = document.getElementById('country').value.trim()
  
  console.log('address validation')
  const pinCodePattern = /^[0-9]+$/;
  const statePattern = /^[A-Za-z\s]+$/;

  if (!statePattern.test(street)) {
      document.getElementById('messageShow').innerHTML = 'The street name should not contain numbers or special characters.';
      return false; 
  }
  if (!statePattern.test(city)) {
      document.getElementById('messageShow').innerHTML = 'The city name should not contain numbers or special characters.';
      return false; 
  }
  if (!statePattern.test(state)) {
      document.getElementById('messageShow').innerHTML = 'The state name should not contain numbers or special characters.';
      return false; 
  }
  if (!statePattern.test(country)) {
      document.getElementById('messageShow').innerHTML = 'The country name should not contain numbers or special characters.';
      return false; 
  }
 
  else if(street.length <=2 ){
      document.getElementById('messageShow').innerHTML = "The street name should contain more than 2 characters."
      return false
  }
  else if (city.length<=2) {
  document.getElementById('messageShow').innerHTML = 'The city name should contain more than 2 characters.';
  return false; 
  }
  if (!pinCodePattern.test(pinCode)) {
  document.getElementById('messageShow').innerHTML = 'The pin code should contain numbers only.';
  return false; 
  }
  else if (pinCode.length > 6 || pinCode.length < 6) {
  document.getElementById('messageShow').innerHTML = 'The pin code should contain exactly 6 numbers.';
  return false; 
  }
  else if (state.length <= 2) {
  document.getElementById('messageShow').innerHTML = 'The state should contain atleast 2 characters.';
  return false; 
  }
  else if (country.length <= 2) {
  document.getElementById('messageShow').innerHTML = 'The country should contain atleast 2 characters.';
  return false; 
  }
  
  document.getElementById('messageShow').innerHTML = '';
  return true;

}