import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject, concat, exhaustMap, map, merge, of, shareReplay, startWith, switchMap, withLatestFrom } from 'rxjs';
import { ConfigVm, LlmConfigOptionResponse, User } from '@http';
import { TextStreamService } from './text-stream.service';
import { EnvironmentService } from './environment.service';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly textStreamService = inject(TextStreamService);
  private readonly env = inject(EnvironmentService);

  llmConfigsRefetch$ = new Subject<void>();
  activateConfig$ = new Subject<number>();
  deleteConfig$ = new Subject<number>();

  llmConfigs$: Observable<ConfigVm[]> = this.llmConfigsRefetch$.pipe(
    startWith(null),
    switchMap(() => this.getLlmConfigs()),
    switchMap((init) => {
      return concat(
        of(init),
        merge(
          this.llmConfigsRefetch$.pipe(
            withLatestFrom(this.llmConfigs$),
            exhaustMap(() => this.getLlmConfigs()),
          ),
          this.deleteConfig$.pipe(
            withLatestFrom(this.llmConfigs$),
            exhaustMap(([configIdToDelete, configs]) => {
              return this.deleteConfig(configIdToDelete).pipe(
                map(() => {
                  return configs.filter(c => c.id !== configIdToDelete)
                }),
              );
            }),
          ),
          this.activateConfig$.pipe(
            withLatestFrom(this.llmConfigs$),
            switchMap(([configIdToActivate , configs]) => {
              return this.activateConfig(configIdToActivate).pipe(
                map(() => {
                  configs.forEach((c) => {
                    c.isActive = c.id === configIdToActivate;
                  });
                  return [...configs];
                }),
              );
            }),
          ),
        )
      );
    }),
    shareReplay(1),
  );

  // activeConfig$ = of(null);
  activeConfig$ = this.llmConfigs$.pipe(
    map(configs => configs.find(c => c.isActive) ?? null),
    shareReplay(1),
  );

  private getLlmConfigs() {
    return this.env.withApiUrl$(url => this.http.get<ConfigVm[]>(`${url}/configs`));
  }

  getLlmOptions() {
    return this.env.withApiUrl$(url => this.http.get<LlmConfigOptionResponse[]>(`${url}/models`));
  }

  downloadFile(option: string) {
    return this.textStreamService.requestTextStream$(`/file/${option}`, {});
  }

  activateConfig(configId: number) {
    return this.env.withApiUrl$(url => this.http.post<void>(`${url}/configs/${configId}/activate`, {}));
  }

  deleteConfig(configId: number) {
    return this.env.withApiUrl$(url => this.http.delete<void>(`${url}/configs/${configId}`));
  }

  addAzureOpenaiConfig(body: {
    apiKey: string,
    endpoint: string,
    option: string,
  }) {
    return this.env.withApiUrl$(url => this.http.post(`${url}/configs/azure-openai`, body));
  }

  refetchUser$ = new Subject<void>();
  acceptTos$ = new Subject<void>();

  user$: Observable<User> = merge(
    merge(
      of(null),
      this.refetchUser$,
    ).pipe(
      switchMap(() => this.getUser()),
    ),
    this.acceptTos$.pipe(
      switchMap(() => this.acceptTos()),
    ),
  ).pipe(
    shareReplay(1),
  );

  hasAcceptedTermsOfSerivce$ = this.user$.pipe(
    map(user => {
      const tosAcceptedOn = user.document.value.settings.termsOfServiceAcceptedOn;
      if (tosAcceptedOn === undefined) {
        return false;
      }
      const tosAcceptedOnDate = new Date(tosAcceptedOn);
      return tosAcceptedOnDate > latestTos.date;
    }),
    shareReplay(1),
  );
  getUser() {
    return this.env.withApiUrl$(url => this.http.get<User>(`${url}/user`));
  }

  acceptTos() {
    return this.env.withApiUrl$(url => this.http.post<User>(`${url}/user/accept-tos`, {}));
  }
}

const tos_05_29_2024 = `
TERMS OF SERVICE

Last updated: 05/29/2024

1.	Introduction
Welcome to Kish Inc. (“Company”, “we”, “our”, “us”)! As you have just clicked our Terms of Service, please pause, grab a cup of coffee and carefully read the following pages. It will take you approximately 20 minutes.

These Terms of Service (“Terms”, “Terms of Service”) govern your use of our application Control Generator operated by Kish Inc.

Your agreement with us includes these Terms (“Agreements”). You acknowledge that you have read and understood Agreements, and agree to be bound of them.

If you do not agree with (or cannot comply with) Agreements, then you may not use the Service, but please let us know by emailing at krossoff55@gmail.com so we can try to find a solution. These Terms apply to all visitors, users and others who wish to access or use Service.

Thank you for being responsible.

2.	Communications
By using our Service, you agree to subscribe to newsletters, marketing or promotional materials and other information we may send. However, you may opt out of receiving any, or all, of these communications from us by following the unsubscribe link or by emailing at krossoff55@gmail.com.

3.	Subscriptions
Some parts of Service are billed on a subscription basis (“Subscription(s)”). You will be billed in advance on a recurring and periodic basis (“Billing Cycle”). Billing cycles are set either on a monthly or annual basis, depending on the type of subscription plan you select when purchasing a Subscription.

At the end of each Billing Cycle, your Subscription will automatically renew under the exact same conditions unless you cancel it or Kish Inc. cancels it. You may cancel your Subscription renewal either through your online account management page or by contacting Kish Inc. customer support team.

A valid payment method, including credit card, is required to process the payment for your subscription. You shall provide Kish Inc. with accurate and complete billing information including full name, address, state, zip code, telephone number, and a valid payment method information. By submitting such payment information, you automatically authorize Kish Inc. to charge all Subscription fees incurred through your account to any such payment instruments.

Should automatic billing fail to occur for any reason, Kish Inc. will issue an electronic invoice indicating that you must proceed manually, within a certain deadline date, with the full payment corresponding to the billing period as indicated on the invoice.

4.	Free Trial
Kish Inc. may, at its sole discretion, offer a Subscription with a free trial for a limited period of time (“Free Trial”).

You may be required to enter your billing information in order to sign up for Free Trial.

If you do enter your billing information when signing up for Free Trial, you will not be charged by Kish Inc. until Free Trial has expired. On the last day of Free Trial period, unless you cancelled your Subscription, you will be automatically charged the applicable Subscription fees for the type of Subscription you have selected.

At any time and without notice, Kish Inc. reserves the right to (i) modify Terms of Service of Free Trial offer, or (ii) cancel such Free Trial offer.

5.	Fee Changes
Kish Inc., in its sole discretion and at any time, may modify Subscription fees for the Subscriptions. Any Subscription fee change will become effective at the end of the then-current Billing Cycle.

Kish Inc. will provide you with a reasonable prior notice of any change in Subscription fees to give you an opportunity to terminate your Subscription before such change becomes effective.

Your continued use of Service after Subscription fee change comes into effect constitutes your agreement to pay the modified Subscription fee amount.

6.	Refunds
Except when required by law, paid Subscription fees are non-refundable.

7.	Content
Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material (“Content”). You are responsible for Content that you post on or through Service, including its legality, reliability, and appropriateness.

By posting Content on or through Service, You represent and warrant that: (i) Content is yours (you own it) and/or you have the right to use it and the right to grant us the rights and license as provided in these Terms, and (ii) that the posting of your Content on or through Service does not violate the privacy rights, publicity rights, copyrights, contract rights or any other rights of any person or entity. We reserve the right to terminate the account of anyone found to be infringing on a copyright.

You retain any and all of your rights to any Content you submit, post or display on or through Service and you are responsible for protecting those rights. We take no responsibility and assume no liability for Content you or any third party posts on or through Service.

8.	Prohibited Uses
You may use Service only for lawful purposes and in accordance with Terms. You agree not to use Service:

(a)	In any way that violates any applicable national or international law or regulation.

(b)	For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way by exposing them to inappropriate content or otherwise.

(c)	To transmit, or procure the sending of, any advertising or promotional material, including any “junk mail”, “chain letter,” “spam,” or any other similar solicitation.

(d)	To impersonate or attempt to impersonate Company, a Company employee, another user, or any other person or entity.

(e)	In any way that infringes upon the rights of others, or in any way is illegal, threatening, fraudulent, or harmful, or in connection with any unlawful, illegal, fraudulent, or harmful purpose or activity.

(f)	To engage in any other conduct that restricts or inhibits anyone’s use or enjoyment of Service, or which, as determined by us, may harm or offend Company or users of Service or expose them to liability.

Additionally, you agree not to:

(a)	Use Service in any manner that could disable, overburden, damage, or impair Service or interfere with any other party’s use of Service, including their ability to engage in real time activities through Service.

(b)	Use any robot, spider, or other automatic device, process, or means to access Service for any purpose, including monitoring or copying any of the material on Service.

(c)	Use any manual process to monitor or copy any of the material on Service or for any other unauthorized purpose without our prior written consent.

(d)	Use any device, software, or routine that interferes with the proper working of Service.

(e)	Introduce any viruses, trojan horses, worms, logic bombs, or other material which is malicious or technologically harmful.

(f)	Attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of Service, the server on which Service is stored, or any server, computer, or database connected to Service.

(g)	Attack Service via a denial-of-service attack or a distributed denial-of-service attack.

(h)	Take any action that may damage or falsify Company rating.

(i)	Otherwise attempt to interfere with the proper working of Service.

9.	Data Security
You acknowledge that you are solely responsible for the security and confidentiality of all data that you input, store, or transmit through Service, including but not limited to confidential, sensitive, or personally identifiable information. You agree to implement appropriate security measures to protect such data and to use Service in compliance with all applicable laws and regulations pertaining to data privacy and protection. Service may utilize external large language model (“LLM”) services for certain functionalities. You understand and agree that any data processed by these external LLM services is subject to the privacy policy and terms of service of the respective service providers. Kish Inc. is not responsible for the data processing practices of these external LLM services. Kish Inc. expressly disclaims any responsibility or liability for the collection, use, storage, or disclosure of data by any external LLM service provider. You are advised to review the privacy policy and terms of service of the external LLM service providers to understand their data processing practices and the measures they take to protect your data. By using Service, you acknowledge and agree that Kish Inc. is not liable for any breach of data, unauthorized access, or misuse of information by LLM (internal or externally stored). You further agree to hold Kish Inc. harmless against any claims, damages, or losses that may arise from the use of LLM services.

10.	No Use By Minors
Service is intended only for access and use by individuals at least eighteen (18) years old. By accessing or using any of Company, you warrant and represent that you are at least eighteen (18) years of age and with the full authority, right, and capacity to enter into this agreement and abide by all of the terms and conditions of Terms. If you are not at least eighteen (18) years old, you are prohibited from both the access and usage of Service.

11.	Accounts
When you create an account with us, you guarantee that you are above the age of 18, and that the information you provide us is accurate, complete, and current at all times. Inaccurate, incomplete, or obsolete information may result in the immediate termination of your account on Service.

You are responsible for maintaining the confidentiality of your account and password, including but not limited to the restriction of access to your computer and/or account. You agree to accept responsibility for any and all activities or actions that occur under your account and/or password, whether your password is with our Service or a third-party service. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.

You may not use as a username the name of another person or entity or that is not lawfully available for use, a name or trademark that is subject to any rights of another person or entity other than you, without appropriate authorization. You may not use as a username any name that is offensive, vulgar or obscene.

We reserve the right to refuse service, terminate accounts, remove or edit content, or cancel orders in our sole discretion.

12.	Intellectual Property
Service and its original content (excluding Content provided by users), features and functionality are and will remain the exclusive property of Kish Inc. and its licensors. Service is protected by copyright, trademark, and other laws of the United States. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Kish Inc..

13.	Copyright Policy
We respect the intellectual property rights of others. It is our policy to respond to any claim that Content posted on Service infringes on the copyright or other intellectual property rights (“Infringement”) of any person or entity.

If you are a copyright owner, or authorized on behalf of one, and you believe that the copyrighted work has been copied in a way that constitutes copyright infringement, please submit your claim via email to krossoff55@gmail.com, with the subject line: “Copyright Infringement” and include in your claim a detailed description of the alleged Infringement as detailed below, under “DMCA Notice and Procedure for Copyright Infringement Claims”

You may be held accountable for damages (including costs and attorneys' fees) for misrepresentation or bad-faith claims on the infringement of any Content found on and/or through Service on your copyright.

14.	DMCA Notice and Procedure for Copyright Infringement Claims
You may submit a notification pursuant to the Digital Millennium Copyright Act (DMCA) by providing our Copyright Agent with the following information in writing (see 17 U.S.C 512(c)(3) for further detail):

(a)	an electronic or physical signature of the person authorized to act on behalf of the owner of the copyright's interest;

(b)	a description of the copyrighted work that you claim has been infringed, including the URL (i.e., web page address) of the location where the copyrighted work exists or a copy of the copyrighted work;

(c)	identification of the URL or other specific location on Service where the material that you claim is infringing is located;

(d)	your address, telephone number, and email address;

(e)	a statement by you that you have a good faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law;

(f)	a statement by you, made under penalty of perjury, that the above information in your notice is accurate and that you are the copyright owner or authorized to act on the copyright owner's behalf.

You can contact our Copyright Agent via email at krossoff55@gmail.com

15.	Error Reporting and Feedback
You may provide us directly at krossoff55@gmail.com with information and feedback concerning errors, suggestions for improvements, ideas, problems, complaints, and other matters related to our Service (“Feedback”). You acknowledge and agree that: (i) you shall not retain, acquire or assert any intellectual property right or other right, title or interest in or to the Feedback; (ii) Company may have development ideas similar to the Feedback; (iii) Feedback does not contain confidential information or proprietary information from you or any third party; and (iv) Company is not under any obligation of confidentiality with respect to the Feedback. In the event the transfer of the ownership to the Feedback is not possible due to applicable mandatory laws, you grant Company and its affiliates an exclusive, transferable, irrevocable, free-of-charge, sub-licensable, unlimited and perpetual right to use (including copy, modify, create derivative works, publish, distribute and commercialize) Feedback in any manner and for any purpose.

16.	Links To Other Web Sites
Our Service may contain links to third party web sites or services that are not owned or controlled by Kish Inc.

Kish Inc. has no control over, and assumes no responsibility for the content, privacy policies, or practices of any third party web sites or services. We do not warrant the offerings of any of these entities/individuals or their websites.

YOU ACKNOWLEDGE AND AGREE THAT KISH INC. SHALL NOT BE RESPONSIBLE OR LIABLE, DIRECTLY OR INDIRECTLY, FOR ANY DAMAGE OR LOSS CAUSED OR ALLEGED TO BE CAUSED BY OR IN CONNECTION WITH USE OF OR RELIANCE ON ANY SUCH CONTENT, GOODS OR SERVICES AVAILABLE ON OR THROUGH ANY SUCH THIRD PARTY WEB SITES OR SERVICES.

WE STRONGLY ADVISE YOU TO READ THE TERMS OF SERVICE AND PRIVACY POLICIES OF ANY THIRD PARTY WEB SITES OR SERVICES THAT YOU VISIT.

17.	Disclaimer Of Warranty
THESE SERVICES ARE PROVIDED BY COMPANY ON AN “AS IS” AND “AS AVAILABLE” BASIS. COMPANY MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, AS TO THE OPERATION OF THEIR SERVICES, OR THE INFORMATION, CONTENT OR MATERIALS INCLUDED THEREIN. YOU EXPRESSLY AGREE THAT YOUR USE OF THESE SERVICES, THEIR CONTENT, AND ANY SERVICES OR ITEMS OBTAINED FROM US IS AT YOUR SOLE RISK.

NEITHER COMPANY NOR ANY PERSON ASSOCIATED WITH COMPANY MAKES ANY WARRANTY OR REPRESENTATION WITH RESPECT TO THE COMPLETENESS, SECURITY, RELIABILITY, QUALITY, ACCURACY, OR AVAILABILITY OF THE SERVICES. WITHOUT LIMITING THE FOREGOING, NEITHER COMPANY NOR ANYONE ASSOCIATED WITH COMPANY REPRESENTS OR WARRANTS THAT THE SERVICES, THEIR CONTENT, OR ANY SERVICES OR ITEMS OBTAINED THROUGH THE SERVICES WILL BE ACCURATE, RELIABLE, ERROR-FREE, OR UNINTERRUPTED, THAT DEFECTS WILL BE CORRECTED, THAT THE SERVICES OR THE SERVER THAT MAKES IT AVAILABLE ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS OR THAT THE SERVICES OR ANY SERVICES OR ITEMS OBTAINED THROUGH THE SERVICES WILL OTHERWISE MEET YOUR NEEDS OR EXPECTATIONS.

COMPANY HEREBY DISCLAIMS ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF MERCHANTABILITY, NON-INFRINGEMENT, AND FITNESS FOR PARTICULAR PURPOSE.

THE FOREGOING DOES NOT AFFECT ANY WARRANTIES WHICH CANNOT BE EXCLUDED OR LIMITED UNDER APPLICABLE LAW.

18.	Limitation Of Liability
EXCEPT AS PROHIBITED BY LAW, YOU WILL HOLD US AND OUR OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS HARMLESS FOR ANY INDIRECT, PUNITIVE, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGE, HOWEVER IT ARISES (INCLUDING ATTORNEYS' FEES AND ALL RELATED COSTS AND EXPENSES OF LITIGATION AND ARBITRATION, OR AT TRIAL OR ON APPEAL, IF ANY, WHETHER OR NOT LITIGATION OR ARBITRATION IS INSTITUTED), WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE, OR OTHER TORTIOUS ACTION, OR ARISING OUT OF OR IN CONNECTION WITH THIS AGREEMENT, INCLUDING WITHOUT LIMITATION ANY CLAIM FOR PERSONAL INJURY OR PROPERTY DAMAGE, ARISING FROM THIS AGREEMENT AND ANY VIOLATION BY YOU OF ANY FEDERAL, STATE, OR LOCAL LAWS, STATUTES, RULES, OR REGULATIONS, EVEN IF COMPANY HAS BEEN PREVIOUSLY ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. EXCEPT AS PROHIBITED BY LAW, IF THERE IS LIABILITY FOUND ON THE PART OF COMPANY, IT WILL BE LIMITED TO THE AMOUNT PAID FOR THE PRODUCTS AND/OR SERVICES, AND UNDER NO CIRCUMSTANCES WILL THERE BE CONSEQUENTIAL OR PUNITIVE DAMAGES. SOME STATES DO NOT ALLOW THE EXCLUSION OR LIMITATION OF PUNITIVE, INCIDENTAL OR CONSEQUENTIAL DAMAGES, SO THE PRIOR LIMITATION OR EXCLUSION MAY NOT APPLY TO YOU.

19.	Termination
We may terminate or suspend your account and bar access to Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of Terms.

If you wish to terminate your account, you may simply discontinue using Service.

All provisions of Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity and limitations of liability.

20.	Governing Law
These Terms shall be governed and construed in accordance with the laws of State of Colorado without regard to its conflict of law provisions.

Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect. These Terms constitute the entire agreement between us regarding our Service and supersede and replace any prior agreements we might have had between us regarding Service.

21.	Changes To Service
We reserve the right to withdraw or amend our Service, and any service or material we provide via Service, in our sole discretion without notice. We will not be liable if for any reason all or any part of Service is unavailable at any time or for any period. From time to time, we may restrict access to some parts of Service, or the entire Service, to users, including registered users.

22.	Amendments To Terms
We may amend Terms at any time by posting the amended terms on this site. It is your responsibility to review these Terms periodically.

Your continued use of the Platform following the posting of revised Terms means that you accept and agree to the changes. You are expected to check this page frequently so you are aware of any changes, as they are binding on you.

By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, you are no longer authorized to use Service.

23.	Waiver And Severability
No waiver by Company of any term or condition set forth in Terms shall be deemed a further or continuing waiver of such term or condition or a waiver of any other term or condition, and any failure of Company to assert a right or provision under Terms shall not constitute a waiver of such right or provision.

If any provision of Terms is held by a court or other tribunal of competent jurisdiction to be invalid, illegal or unenforceable for any reason, such provision shall be eliminated or limited to the minimum extent such that the remaining provisions of Terms will continue in full force and effect.

24.	Acknowledgement
BY USING SERVICE OR OTHER SERVICES PROVIDED BY US, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE AND AGREE TO BE BOUND BY THEM.

25.	Contact Us
Please send your feedback, comments, requests for technical support:
By email: krossoff55@gmail.com.
`;

const tosEntries = [
  {
    date: new Date(2024, 4, 29),
    tos: tos_05_29_2024,
  },
];

// @TODO idk if this is getting sorted the right way
export const latestTos = tosEntries.sort((a, b) => {
  if (a.date < b.date) {
    return -1;
  } else if (a.date > b.date) {
    return 1;
  }
  return 0;
}).at(0)!;
