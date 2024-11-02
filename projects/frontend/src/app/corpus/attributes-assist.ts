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
IPE Attributes:
The following are templates to assist you in writing IPE design attributes. These are a general guide for how to write these kinds of attributes.

Accuracy and Validation Example:
IPC Attribute A - [Report Name]
The [Control Operator], using the [System/Software Name], runs the [Report Name] with data for the applicable period. The report is then cross-checked against the [Underlying Source Data such as system screenshots] for accuracy, and a comparison of selected key figures is performed. Any discrepancies are investigated and resolved. The [Control Operator] reviews the report, focusing on the accuracy of selected key metrics, and validates that no discrepancies are present. The review is evidenced by annotating with initials, dates, and comments if applicable.

Completeness Example:
IPC Attribute B - [Document/Report Name]
The [Control Operator] runs the [Report Name] in [System/Software Name]. This report is then exported to excel where the [Control Operator] verifies the total row count of the exported report ties to the system and retains a screenshot to evidence this. Report parameters are retained by the Control Operator. Review completion is evidenced by initials and date.

Authorization and Review Example:
IPC Attribute C - [Document/Report Name]
Manual [System] entries are reviewed and approved by [Control Operator] prior to posting to the system. The reviewer ensures that all entries meet the necessary authorization criteria, are supported by adequate documentation and comply with internal policies. The review is documented by the reviewer's initials and dates.

Reconciliation and Comparison Example:
IPC Attribute D - [Report Name]
Upon generation of the [Report Name] by the [Control Operator], the report's total figures are reconciled to the control totals from the [Control Report/System Name]. Both reports should be run using consistent parameters (such as date and scope). Any variances identified are investigated and documented. The [Control Operator] confirms reconciliation accuracy, with the review evidenced by initialing and dating the report.

Parameter Review Example:
IPC Attribute E - [IPC Name]
The [Report Name] generated by [Control Operator] in [System/Software Name] is based on critical parameters, which include [List Parameters]. The [Control Operator] verifies that these parameters are set correctly. The correct setup is evidenced by a screenshot of the parameter settings and a review signature with initials and date.
`;

const judgement = `
Judgement/Complexity:
When judgment is involved in a control attribute, it introduces challenges in elaborating on:
- the subjectivity involved in the control attribute; and
- the 'triggers' embedded in the judgmental element that may lead to the identification and investigation of outliers.

Control activities involving judgment are often used in complex areas with the potential for a higher risk of material misstatement, which may increase the amount of evidence needed to show how the control is designed, implemented and operating. This is particularly true in situations where a third party (such as an external auditor) assesses the effectiveness of the entity’s controls. At the same time, gathering and maintaining more evidence may present additional challenges for a control involving judgment.

Practical Tip:
In the words of the COSO Framework, controls “cannot be performed entirely in the minds of senior management without some documentation of management’s thought process and analyses.” It may be most effective for control operators to retain such documentation concurrently with the performance of a control involving judgment. To do so, the control operator could document their thought process, including how they identified and resolved outliers, or what led them to not identify any outliers.

Because this control contains significant judgement or complexity, it is important that the control operator's thought process is thoroughly documented throughout the attributes with sufficient "inspection level evidence" that can be reviewed by a third party (i.e. external auditor).
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
