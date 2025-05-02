import { FormGroup, Validators } from '@angular/forms';

export function updateParticipantValidators(form: FormGroup, type: 'PERSON' | 'COMPANY'| null): void {

  // Väljade nimekirjad eraisiku ja ettevõtte jaoks
  const personControls = ['firstName', 'lastName', 'personalCode'];
  const companyControls = ['companyName', 'registrationCode'];

  // Uuendame valiidaatoreid vastavalt tüübile
  if (type === 'PERSON') {
    personControls.forEach((control) =>
      form.get(control)?.setValidators([Validators.required])
    );
    companyControls.forEach((control) => form.get(control)?.clearValidators());
  } else {
    companyControls.forEach((control) =>
      form.get(control)?.setValidators([Validators.required])
    );
    personControls.forEach((control) => form.get(control)?.clearValidators());
  }

  // Uuendame väljade kehtivust
  personControls.concat(companyControls).forEach((control) =>
    form.get(control)?.updateValueAndValidity()
  );

  console.log('New companyName validator:', form.get('companyName')?.validator);
}
