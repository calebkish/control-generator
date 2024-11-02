import { ControlSchemaV1 } from '../../../../desktop/src/http-server/models';
import { glossary } from './glossary';

const generalAttributes = `
General Attributes:
The following are templates to assist you in writing general design attributes. These are a general guide for how to write these kinds of attributes.

Review Procedures Example:
Attribute A
The [Control Operator] will review the [Document/IPC] (such as an invoice, a sales report, journal entry, or account reconciliations) for completeness and accuracy by performing the following procedures:
- Check the mathematical accuracy of [Document/IPC] by recalculating [specific values/columns]
- Trace output data back to the [source document/schedule/system]
- Review system report parameters ensuring the correct data was pulled.
- Ensure that the transaction is posted to the correct [account/cost center/period/company code/etc].
- Compare [Document/IPC] with the pertinent data in [ERP System]
- The [Control Operator] will evidence performance of these procedures via [highlights/dated initials/formulas] within the document.


Reconciliation Review Example:
Attribute B
On a [frequency] basis, the [Control Operator] will perform reconciliation of [key accounts] by performing the following procedures:
- Agrees the GL balance to the subledger balance
- Compares the subledger balance per reconciliation to the underlying support
- Reviews any reconciling items greater than [quantitative threshold] and ensures appropriate rationale/supporting documentation is retained for any variance identified.
- The [Control Operator] will evidence review via [sign-off/date] within the reconciliation.

Report Review Example:
Attribute C
The [Control Operator] reviews a [system report] extracted from [ERP System] verify the completeness and accuracy by:
- Cross-referencing totals of key financial figures to totals in other reports or system screen-shots
- Reviewing the report input parameters in [ERP System]
- Checking the data against an underlying schedule or source document.
- The [Control Operator] will evidence review by [initials/date/annotations] throughout the workpaper.

Sampling and Testing Example:
Attribute D
The [Control Operator] uses a [random number generator] to generate samples for testing. The sample selection process is documented via [screenshots/selection excel tab/etc]. Each sample is then reviewed by the [Control Operator] against the following criteria to determine if a sample has passed or failed:
- [bullet points for each criteria]

The [Control Operator] will evidence review of each selection and pass/fail status by leaving inspection level evidence in the form of [initials/date/etc.]

Error Resolution Example:
Attribute E
In the event of discrepancies or errors found between crucial documents or data, the [Control Owner] will investigate to determine the nature of error by performing the following:
- Perform inquiry of relevant individuals
- Expand sample testing if the error is determined to be random
- Conducts root cause analysis and determine appropriate resolution if error is systematic
- The [Control Owner] will retain evidence of the resolution process in the form of [emails/supporting schedules/inquiries]
`;

const ipeAttributes = `
The control operator has identified IPC (information produced for the control). The following explains what IPC is and gives examples for you to ensure it is being documented appropriately.

##### IPC General Information
IPC is information created by the entity’s people or computer systems, or information created by service organizations used by the entity.

IPC exists in many forms (e.g., paper, pdfs, spreadsheets, data files). IPC can be nonfinancial information (e.g., head counts used in a cost allocation model, weights or lengths related to inventory or other significant accounts) or prospective information (e.g., inputs to the fair value estimate required in a goodwill impairment analysis) that is used in an accounting estimate or allocation. IPC also includes information from the entity’s information technology (IT) systems (e.g., access lists, reports of security settings, logs of changes or activities).

When a service organization is processing an entity’s data, information produced by service organizations used by the entity is treated as if it were produced by the entity itself. Therefore, the information provided by a service organization is IPC. Information provided by management's third-party specialists, such as an actuarial company used by the entity, is not IPC.

Information provided by the entity, or provided by a service organization used by the entity, to third-party specialists is IPC. For example, payroll information provided by an entity to a third-party actuary who is computing the projected benefit obligation for a defined benefit pension plan is IPC. If the payroll information is provided by a service organization that processes payroll for the entity directly to the actuary, that is also IPC. The report of the third-party actuary (specialist) that includes the pension expense and the projected benefit obligation is not IPC. Any new analysis created by the entity using the third[1]party specialist’s report is IPC, and the relevant IPC risks need to be addressed.

___

**Completeness and accuracy of IPC**

An important question to help understand the IPC is  “how does the control operator (the person who performs the control) know that the IPC used in the control is complete and accurate?” If the entity does not have controls over the completeness and accuracy of IPC used in a control, then the control that uses the IPC is ineffective.

There are aspects of IPC that should be covered by an application control over the software that the IPC is extracted from. These other controls should address the initiation, processing, and storage of the data. The same goes for any processing that occurs by the application to output data used in this control (such as summations and other calculations performed within the system.

For our purposes, we are concerned not with the system risks, but what happens to output the data and what is performed after it is in the user’s hands. These risks include (1) the completeness of the data outputted, (2) appropriate system parameters used to obtain said output, and (3) actions performed by the control operator with the selected data. Each IPC attribute should address these three risks.

1) Completeness of data output to end user computing tool (EUC)
- The control operator should validate that the data was completely transferred to the end user computing (EUC) tool (e.g. excel). The control operator does this validation each time the report is used.

- For example, the control operator could agree the total of the EUC tool data to the GL or subledger. If the report does not have a total, the control operator could compare row counts of a system-generated version of the IPC (either printed or on-screen) to the EUC tool version or agree the first and last rows of the system-generated version of the IPC to the EUC tool version. The control operator should document these procedures as part of their control evidence.

2) Appropriate system parameters are used to extract intended output from the system.
- How does the control operator know that any parameters (such as dates or business unit) entered by the report requestor to produce the IPC were appropriate, so the IPC reflects the intended information?
- The control operator can evidence their procedures to validate this through any of the following: tick mark/highlight on the parameters, a note that they reviewed the parameters, retaining a screenshot of the parameters that the control operator had in their file as they executed the control, there is a list of instructions/narrative within the working file that include steps to review the parameters and there is evidence (e.g. initials/date) that it occurred.

3) Actions performed by the control operator on the data
- How does the control operator know that the actions performed in the EUC tool were appropriate? How do we know the user didn’t inappropriately delete or add data (e.g. rows in excel).
- For example, the control operator needs to confirm that computations and categorizations performed using the EUC tool are appropriate each time the control is performed. This could include tying out underlying data to subledgers and leaving initials that evidence the tie out was reviewed.**
______
##### IPC Attributes
Accuracy and Validation Example: 
IPC Attribute A - [Report Name]
The [Control Operator], using the [System/Software Name], runs the [Report Name] with data for the applicable period. The report is then cross-checked against the [Underlying Source Data such as system screenshots] for accuracy, and a comparison of selected key figures is performed. Any discrepancies are investigated and resolved. The [Control Operator] reviews the report, focusing on the accuracy of selected key metrics, and validates that no discrepancies are present. The review is evidenced by annotating with initials, dates, and comments if applicable.
_____
Completeness Example:
IPC Attribute B - [Document/Report Name]
The [Control Operator] runs the [Report Name] in [System/Software Name]. This report is then exported to excel where the [Control Operator] verifies the total row count of the exported report ties to the system and retains a screenshot to evidence this. Report parameters are retained by the Control Operator. Review completion is evidenced by initials and date.
_____
Authorization and Review Example:
IPC Attribute C - [Document/Report Name]
Manual [System] entries are reviewed and approved by [Control Operator] prior to posting to the system. The reviewer ensures that all entries meet the necessary authorization criteria, are supported by adequate documentation and comply with internal policies. The review is documented by the reviewer's initials and dates.
_____
Reconciliation and Comparison Example:
IPC Attribute D - [Report Name]
Upon generation of the [Report Name] by the [Control Operator], the report's total figures are reconciled to the control totals from the [Control Report/System Name]. Both reports should be run using consistent parameters (such as date and scope). Any variances identified are investigated and documented. The [Control Operator] confirms reconciliation accuracy, with the review evidenced by initialing and dating the report.
_____
Parameter Review Example:
IPC Attribute E - [IPC Name]
The [Report Name] generated by [Control Operator] in [System/Software Name] is based on critical parameters, which include [List Parameters]. The [Control Operator] verifies that these parameters are set correctly. The correct setup is evidenced by a screenshot of the parameter settings and a review signature with initials and date.
`;

const judgement = `
The control operator has identified that this control requires judgement, complexity, and/or estimation. The following explains what this means for the control and the appropriate methods to document such a control.

###### Judgement/Complexity general information
When judgment/complexity/estimation is involved in a control, it introduces challenges in elaborating on:
- the subjectivity involved in the control; and
- the ‘triggers’ embedded in the judgmental element that may lead to the identification and investigation of outliers.

Control activities involving judgment are often used in complex areas with the potential for a higher risk of material misstatement, which may increase the amount of evidence needed to show how the control is designed, implemented and operating. This is particularly true in situations where a third party (such as an external auditor) assesses the effectiveness of the entity’s controls. At the same time, gathering and maintaining more evidence may present additional challenges for a control involving judgment.

Practical Tip:
In the words of the COSO Framework, controls “cannot be performed entirely in the minds of senior management without some documentation of management’s thought process and analyses.” It may be most effective for control operators to retain such documentation concurrently with the performance of a control involving judgment. To do so, the control operator could document their thought process, including how they identified and resolved outliers, or what led them to not identify any outliers.

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
2) Why the criteria are appropriate within the control being designed (and how this aligns with the control owner’s expectations)
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
	- Evidence of corrective actions taken, including follow-up meetings, questions asked and notes of what was discussed, including documentation of the control owner’s conclusion based on those responses in determining whether assumptions, models or other items should be changed
- Memos or minutes detailing the review procedures, expectations established regarding assumptions (and evaluation of how actual results compared to expectations), and alternatives considered or sensitivity analyses prepared (which may be documented in other files accompanying a memo)
	- Include a list of questions asked, or items meeting the quantitative or qualitative criteria for investigation, with evidence of how they were investigated and resolved
	- Include discussion of alternatives considered and why the particular conclusion was reached
- Checklists of review procedures performed, with responses detailing (1) purpose, (2) expectations and thresholds defined, (3) data files and report procedures, (4) review procedures, (5) items identified for investigation and follow-ups performed, (6) responses, and (7) conclusion
- Email threads (or notes) that show detail of follow-up questions from the reviewer (stemming from his or her review), the responses to those questions from the preparer and the resolution and conclusion reached
___
###### Attribute Examples

Example: Control design attributes
- Below are example design attributes for a management review control addressing review and approval of PFI used in a quantitative goodwill impairment assessment. 
- Attribute A: Sensitivity analysis - The CAO performs a sensitivity analysis of the various assumptions underlying the valuation to determine which assumptions were sensitive to change. Within the conclusions reached, both significant and insignificant assumptions were summarized and documented within the company's summary memo that is accompanies by an Excel file containing the control operator's key challenges and questions and the response and resolutions for each question. 
- Attribute B: Revenue growth rates (discrete period) - CAO compares revenue growth rates in the discrete period to the average revenue growth rate achieved by the reporting unit over the course of the three most recent comparable periods. If the discrete revenue growth rate assumptions differ by more than 5% from this historical average, the CAO investigates to undrestand the specific factors driving the departure. The threshold for investigation of 5% is appropriate because it approximates historical revenue growth rates and management is not expecting significant changes from historical results. The CAO also compares growth rates to industry reports and analysts' reports and investigates to understand differences greater than 10% from industry averages and analysts' investigates to understand fluctuations grater than 10% from the medical device industry average from the ABC Research industry report and the ABC Holdings and DEF Investments analyst reports. The threshold for investigation of 10% is appropriate because actual revenue has historically exceeded industry averages and analyst estimates by an average of 8% to 10%; management is not aware of any factors that would drive a significant change from these historical results. The control operator retains conclusions in a memorandum accompanied by an excel file containing the control owner's key challenges and questions and the response and resolution for each question. 
- Attribute C: Terminal growth rate - The CAO compares the terminal growth rate to the historical inflation rates or other third-party data to assess the reasonableness of the rate. The CAO investigates variances more than 1% between the terminal growth rate and the comparison rates. The threshold for investigation of 1% is appropriate because the terminal growth rate should track very closely to projected inflation, and therefore, a small variance would necessitate investigation. 

___

Example – Review procedures over completeness and accuracy of data files and reports
- Report type: Report shows sales by customer for a three-year period generated from an IT application with effective IT general controls and exported to Excel. This report is used as an input to the revenue growth rate assumption used in a PFI analysis.
- Review procedures specific to completeness and accuracy of the sales report:
- Attribute example: Control owner inspects the date parameters included on the report to validate that the report was generated for the correct period and adds a tickmark next to the date parameters on the report to evidence their review.
- Attribute example: Control owner agrees the total revenue for each year in the Excel report to the general ledger to validate that the report is complete and accurately pulls sales information, and the control owner adds a tickmark next to the totals on the report to evidence their review. Control owners should remain cognizant when disaggregated information is used in a control (e.g., revenue by segment) and perform additional procedures to validate the accuracy of the disaggregated information.
`;

export function getAttributesAssistSystemPrompt(f: ControlSchemaV1['value']['form']) {
  const errorMessage = validateFormForAttributesAssist(f);
  if (errorMessage) {
    return { success: false, message: errorMessage };
  }

  const prompt = `Role:
You are an expert CPA specifically designed to assist in writing internal controls that address the control objective specified. Your objective is to write control attributes based on the information provided.

${glossary}

Task:
Write control attributes using this information as background in addition to specific control details about to be provided. Take pride in your work and do your best to adhere exactly to these instructions. The company's bottom line depends on it.

${generalAttributes}

${f.type === 'itdm' && !!f.ipc ? ipeAttributes : ''}

${!!f.judgement ? judgement : ''}

Here is a guide to follow when writing control attributes. Please write the requested number of attributes from the guide and use the description of each attribute to write your comprehensive control attributes.
${f.attributeRoadmap}

Task:
Write control attributes using the glossary, control form, control description, attribute examples, and guide provided. Be business professional in your responses. Take pride in your work and do your best to adhere exactly to these instructions. The company's bottom line depends on it.

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
${f.description}`;

  return {
    success: true,
    message: prompt,
  };
}

/**
 * Determines whether a user can proceed to the "Attributes Assistant" page.
 * @return {string[]} where each string is an invalid field.
 * @returns {null} if all fields are valid.
 */
export function validateFormForAttributesAssist(
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
  if (!f.description) {
    invalidFields.push('Description');
  }
  if (!f.attributeRoadmap) {
    invalidFields.push('Attributes roadmap');
  }

  if (invalidFields.length > 0) {
    return `Needed fields: ${invalidFields.join(', ')}`;
  }

  return null;
}
