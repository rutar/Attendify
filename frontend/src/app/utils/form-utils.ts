import { FormGroup, Validators } from '@angular/forms';

export function updateParticipantValidators(form: FormGroup, type: 'PERSON' | 'COMPANY' | null): void {
  // Väljade nimekirjad eraisiku ja ettevõtte jaoks
  const personControls = ['firstName', 'lastName', 'personalCode'];
  const companyControls = ['companyName', 'registrationCode', 'participantCount'];

  // Uuendame valiidaatoreid vastavalt tüübile
  if (type === 'PERSON') {
    personControls.forEach((control) =>
      form.get(control)?.setValidators([Validators.required])
    );
    companyControls.forEach((control) => form.get(control)?.clearValidators());
  } else if (type === 'COMPANY') {
    companyControls.forEach((control) => {
      if (control === 'participantCount') {
        form.get(control)?.setValidators([Validators.required, Validators.min(1)]);
      } else {
        form.get(control)?.setValidators([Validators.required]);
      }
    });
    personControls.forEach((control) => form.get(control)?.clearValidators());
  } else {
    // Kui tüüp on null, eemaldame kõik valiidaatorid
    personControls.concat(companyControls).forEach((control) =>
      form.get(control)?.clearValidators()
    );
  }

  // Uuendame väljade kehtivust
  personControls.concat(companyControls).forEach((control) =>
    form.get(control)?.updateValueAndValidity()
  );

  console.log('New companyName validator:', form.get('companyName')?.validator);
}
