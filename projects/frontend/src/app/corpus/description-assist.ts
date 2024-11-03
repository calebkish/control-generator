import { ControlSchemaV1 } from '../../../../desktop/src/http-server/models';
import { glossary } from './glossary';

const ipcGeneralInfo = `##### IPC General Information
IPC is information created by the entity's people or computer systems, or information created by service organizations used by the entity.

IPC exists in many forms (e.g., paper, pdfs, spreadsheets, data files). IPC can be nonfinancial information (e.g., head counts used in a cost allocation model, weights or lengths related to inventory or other significant accounts) or prospective information (e.g., inputs to the fair value estimate required in a goodwill impairment analysis) that is used in an accounting estimate or allocation. IPC also includes information from the entity's information technology (IT) systems (e.g., access lists, reports of security settings, logs of changes or activities).

When a service organization is processing an entity's data, information produced by service organizations used by the entity is treated as if it were produced by the entity itself. Therefore, the information provided by a service organization is IPC. Information provided by management's third-party specialists, such as an actuarial company used by the entity, is not IPC.

Information provided by the entity, or provided by a service organization used by the entity, to third-party specialists is IPC. For example, payroll information provided by an entity to a third-party actuary who is computing the projected benefit obligation for a defined benefit pension plan is IPC. If the payroll information is provided by a service organization that processes payroll for the entity directly to the actuary, that is also IPC. The report of the third-party actuary (specialist) that includes the pension expense and the projected benefit obligation is not IPC. Any new analysis created by the entity using the third[1]party specialist's report is IPC, and the relevant IPC risks need to be addressed.

___

**Completeness and accuracy of IPC**

An important question to help understand the IPC is “how does the control operator (the person who performs the control) know that the IPC used in the control is complete and accurate?” If the entity does not have controls over the completeness and accuracy of IPC used in a control, then the control that uses the IPC is ineffective.

There are aspects of IPC that should be covered by an application control over the software that the IPC is extracted from. These other controls should address the initiation, processing, and storage of the data. The same goes for any processing that occurs by the application to output data used in this control (such as summations and other calculations performed within the system.

For our purposes, we are concerned not with the system risks, but what happens to output the data and what is performed after it is in the user's hands. These risks include (1) the completeness of the data outputted, (2) appropriate system parameters used to obtain said output, and (3) actions performed by the control operator with the selected data. Each IPC attribute should address these three risks.

1) Completeness of data output to end user computing tool (EUC)
-The control operator should validate that the data was completely transferred to the end user computing (EUC) tool (e.g. excel). The control operator does this validation each time the report is used.

-For example, the control operator could agree the total of the EUC tool data to the GL or subledger. If the report does not have a total, the control operator could compare row counts of a system-generated version of the IPC (either printed or on-screen) to the EUC tool version or agree the first and last rows of the system-generated version of the IPC to the EUC tool version. The control operator should document these procedures as part of their control evidence.

2) Appropriate system parameters are used to extract intended output from the system.
-How does the control operator know that any parameters (such as dates or business unit) entered by the report requestor to produce the IPC were appropriate, so the IPC reflects the intended information?
-The control operator can evidence their procedures to validate this through any of the following: tick mark/highlight on the parameters, a note that they reviewed the parameters, retaining a screenshot of the parameters that the control operator had in their file as they executed the control, there is a list of instructions/narrative within the working file that include steps to review the parameters and there is evidence (e.g. initials/date) that it occurred.

3) Actions performed by the control operator on the data
- How does the control operator know that the actions performed in the EUC tool were appropriate? How do we know the user didn't inappropriately delete or add data (e.g. rows in excel).
-For example, the control operator needs to confirm that computations and categorizations performed using the EUC tool are appropriate each time the control is performed. This could include tying out underlying data to subledgers and leaving initials that evidence the tie out was reviewed.**`;


const judgementGeneralInfo = `###### Judgement/Complexity general information
When judgment/complexity/estimation is involved in a control, it introduces challenges in elaborating on:
- the subjectivity involved in the control; and
- the 'triggers' embedded in the judgmental element that may lead to the identification and investigation of outliers.

Control activities involving judgment are often used in complex areas with the potential for a higher risk of material misstatement, which may increase the amount of evidence needed to show how the control is designed, implemented and operating. This is particularly true in situations where a third party (such as an external auditor) assesses the effectiveness of the entity's controls. At the same time, gathering and maintaining more evidence may present additional challenges for a control involving judgment.

Practical Tip:
In the words of the COSO Framework, controls “cannot be performed entirely in the minds of senior management without some documentation of management's thought process and analyses.” It may be most effective for control operators to retain such documentation concurrently with the performance of a control involving judgment. To do so, the control operator could document their thought process, including how they identified and resolved outliers, or what led them to not identify any outliers.

Because this control contains significant judgement or complexity, it is important that the control operator's thought process is thoroughly documented throughout the attributes with sufficient "inspection level evidence" that can be reviewed by a third party (i.e. external auditor).

___

Controls with judgement/complexity must have control attributes that address the following:
1) Define expectations to evaluate the review against.
- How do the expectations and thresholds (quantitative and/or qualitative) developed by the control owner guide the performance of the control?
- What is the basis for the expectations and thresholds, and why is it appropriate?
- Where has the control owner historically found exceptions, errors or anomalies, or items for follow-up?
- How does the control owner remain alert for information or evidence that may contradict expectations?
2) Validate completeness and accuracy of data files and reports
- What data files and reports are used in the performance of the control?
- Which procedures does the control owner perform to validate the completeness and accuracy of the data files and reports used in the performance of the control?
3) Evaluate and assess reasonableness of conclusions reached
- If an item is outside the established expectation or threshold, what does the resulting investigation involve? How objective or subjective is the investigation? What type of resolutions could occur?
- Has the control owner considered contrary evidence in the performance of their review?
- How does the control owner document their follow-up procedures?
- How does the control owner evidence the basis for and appropriateness of the resolution?

Within the control attributes, the control owner should document:
1) The criteria applied to identify matters for investigation, including:
- Quantitative considerations (thresholds or metrics used to identify outliers)
- Qualitative considerations (items that are significant, unusual or unreasonable versus expectations)
2) Why the criteria are appropriate within the control being designed (and how this aligns with the control owner's expectations)
___
Appropriateness of quantitative threshold applied
- Threshold: 5% change compared to prior period
- Rationale for threshold: This threshold is appropriate because it would identify a misstatement greater than $1 million, which is less than the threshold determined to be material as part of our internal control policy.
___
Control owner attribute considerations
For each item identified for investigation, the control owner should consider and document:
- Who is responsible for the follow-up actions on the identified matter of investigation?
- What is the nature of the subsequent follow-up to the review? What additional procedures are performed?
- What changes or adjustments (or lack thereof) have occurred based on the questions and/or concerns raised?
    - Posting of a correcting journal entry?
    - Change to underlying assumption or input that results in a subsequent version of the analysis?
- If, as a result of the investigation, it was determined that no changes were needed, why was the reviewer satisfied with the response to the follow-up and where has that conclusion been documented?
- How is the reviewer ultimately satisfied with the responses obtained?
- Why is that change or adjustment appropriate?
- Did these additional follow-up procedures raise new questions that require investigation?
- Were these changes, conclusions and re-evaluations performed timely?
- Has the reviewer retained inspectable evidence that all matters requiring further investigation were adequately addressed?
If no items are identified for investigation, the control operator should challenge the expectations and threshold originally defined and determine if re-evaluation is necessary.
___
Examples of control evidence
- Meeting minutes indicating (1) who attended the meeting, (2) topics that were discussed, (3) questions raised (and answers provided), (4) takeaway actions that were delegated (and evidence that those actions were completed after the meeting) and (5) conclusions drawn
- Draft versions of deliverables/analyses demonstrating changes resulting from the review process (beyond grammatical and formatting updates):
- Shows procedures the reviewer performed (scope of review) to satisfy themselves of the completeness and accuracy of the information, specific items reviewed and follow-up questions (with evidence of answers to those questions)
- Evidence of corrective actions taken, including follow-up meetings, questions asked and notes of what was discussed, including documentation of the control owner's conclusion based on those responses in determining whether assumptions, models or other items should be changed
- Memos or minutes detailing the review procedures, expectations established regarding assumptions (and evaluation of how actual results compared to expectations), and alternatives considered or sensitivity analyses prepared (which may be documented in other files accompanying a memo)
- Include a list of questions asked, or items meeting the quantitative or qualitative criteria for investigation, with evidence of how they were investigated and resolved
- Include discussion of alternatives considered and why the particular conclusion was reached
- Checklists of review procedures performed, with responses detailing (1) purpose, (2) expectations and thresholds defined, (3) data files and report procedures, (4) review procedures, (5) items identified for investigation and follow-ups performed, (6) responses, and (7) conclusion
- Email threads (or notes) that show detail of follow-up questions from the reviewer (stemming from his or her review), the responses to those questions from the preparer and the resolution and conclusion reached`;

const descriptionAssistRole = `Role:
You are an expert CPA specifically designed to assist in writing internal controls that address the control objective specified. Your objective is to ensure the background information for a control contains enough detailed information so that an uninformed user can read that information and write design attributes from it.`;

const descriptionAssistTask = `Task:
Write bullet point questions to critique the control description provided until the description is sufficient enough to write control design attributes. Think step by step for all procedures performed to determine if information is missing to write a complete, concise, and accurate control attribute. Keep each question to a single sentence and business professional. Write only the questions and nothing more. Once you believe the description is sufficient, reply with, "No further recommendations. Please proceed to control design step." Take pride in your work and do your best to adhere exactly to these instructions. The company's bottom line depends on it.`;

export function getDescriptionAssistSystemPrompt(f: ControlSchemaV1['value']['form']) {
  const errorMessage = validateFormForDescription(f);
  if (errorMessage) {
    return { success: false, message: errorMessage };
  }

  let descriptionAssistSystemPrompt = `${descriptionAssistRole}

${glossary}

${f.type === 'itdm' && !!f.ipc ? ipcGeneralInfo : ''}

${!!f.judgement ? judgementGeneralInfo : ''}

${descriptionAssistTask}`;

  return {
    success: true,
    message: descriptionAssistSystemPrompt,
  };
}

export function getDescriptionAssistUserPrompt(
  f: ControlSchemaV1['value']['form'],
  userInput: string
) {
  const errorMessage = validateFormForDescription(f);
  if (errorMessage) {
    return { success: false, message: errorMessage };
  }

  const userPrompt = `What are some bullet point questions to critique the Control Description below, using the Control Form as context? Once you believe the description is sufficient, reply with, "No further recommendations. Please proceed to control design step."

Control Form:
Name: ${f.name}
General Process Category: ${f.generalProcessCategory}
Objective: ${f.objective}
Control type: ${f.type}
${f.type === 'itdm' && !!f.ipc ? `IPC: ${f.ipc}` : ''}
Frequency: ${f.frequency}
${!!f.judgement ? `Judgement/complexity: ${f.judgement}` : ''}
${!!f.quantitativeThesholds ? `Quantitative Thresholds: ${f.quantitativeThesholds}` : ''}
${!!f.qualitativeThresholds ? `Qualitative Thresholds: ${f.qualitativeThresholds}` : ''}
${!!f.investigationProcess ? `Investigation and resolution procedures: ${f.investigationProcess}` : ''}

Control Description:
${userInput}`;

  return {
    success: true,
    message: userPrompt,
  };
};

/**
 * Determines whether a user can proceed to the "Description Assistant" page.
 * @return {string[]} where each string is an invalid field.
 * @returns {null} if all fields are valid.
 */
export function validateFormForDescription(
  f: ControlSchemaV1['value']['form']
) {
  const invalidFields: string[] = [];

  if (!f.generalProcessCategory) {
    invalidFields.push('General Process Category');
  }
  if (!f.objective) {
    invalidFields.push('Objective');
  }
  if (!f.type) {
    invalidFields.push('Control Type');
  }
  if (!f.frequency) {
    invalidFields.push('Frequency');
  }

  if (invalidFields.length > 0) {
    return `Needed fields: ${invalidFields.join(', ')}`;
  }

  return null;
}
