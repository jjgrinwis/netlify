$(document).ready(function () {
  $("form").submit(function (event) {
     var formData = {
      email: $("#fxb_00000000-0000-0000-0000-000000000000_Fields_ecf1e422-8515-4367-8f23-1d1f586f0f63__Value").val(),
      Telefoonnummer: $("#fxb_00000000-0000-0000-0000-000000000000_Fields_90f47d3d-a64b-49a0-94bf-62078f7c1e73__Value").val(),
    };
 
    $.ajax({
      type: "GET",
      url: "https://nmap-vm.secura.com:4444?email="+formData.email+"&telefoonnummer="+formData.Telefoonnummer,
      encode: true,
    }).done(function (data) {
      console.log(data);
    });
 
    event.preventDefault();
  });
});