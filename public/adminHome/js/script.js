$('#update_user').submit(function (event) {
  event.preventDefault();

  let unindexedArray = $(this).serializeArray();
  let data = {};
  $.map(unindexedArray, (n, i) => {
    console.log(unindexedArray);
    data['isBoolean'] = ['true'];
    // console.log(data);
  })

  let request = {
    "url": `http://localhost:3030/api/users/${data.id}`,
    "method": 'PUT',
    "data":data
  }
  // console.log(request);
  $.ajax(request).done(function(response) {
    alert('Data Updated Successfully!');
  });

});