/* =====================================================================
   data.js: every piece of content on the site.
   Sources: résumé, IEEE Xplore (doc 11158918), colligence.in, and
   Vijay's own description of his journey.
   ===================================================================== */

/* ===== CONFIG: edit your links here ===== */
const LINKS = {
  email:    "vijayvishweshwar24@gmail.com",
  linkedin: "https://www.linkedin.com/in/vijay-bhat-146859258",
  github:   "https://github.com/TARGOD",
  resume:   "Vijay_Bhat.pdf",
  paper:    "https://ieeexplore.ieee.org/document/11158918",
  doi:      "https://doi.org/10.1109/ICCTDC64446.2025.11158918",
  company:  "https://colligence.in/"
};

/* ===== shared helpers ===== */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const hexA = (h,a) => { const n=parseInt(h.slice(1),16); return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`; };
const hexRGB = h => { const n=parseInt(h.slice(1),16); return [n>>16&255,n>>8&255,n&255]; };
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const PARAMS = new URLSearchParams(location.search);
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ===== latent space: clusters ===== */
const CL = {
  core:      {name:"Vijay",                color:"#f4efe4", c:[0,0]},
  agents:    {name:"Agents",               color:"#ffb454", c:[-310,-210]},
  retrieval: {name:"Retrieval",            color:"#59d0ff", c:[110,-330]},
  models:    {name:"Models",               color:"#b48cff", c:[460,-20]},
  finance:   {name:"Enterprise & Finance", color:"#5fe3a1", c:[-250,280]},
  eng:       {name:"Engineering",          color:"#ff6b8b", c:[200,300]},
  obs:       {name:"Observability",        color:"#cfd6e6", c:[-500,30]}
};

/* ===== latent space: nodes ===== */
const NODES = [];
const addNode = (id,label,cl,kind,kw,detail,extra={}) => NODES.push({id,label,cl,kind,kw,detail,...extra});

addNode("vijay","Vijay Bhat","core","self","vijay bhat ai product engineer about who summary profile overview bangalore",
  "AI Product Engineer at Colligence Research. IEEE-published, building agents, retrieval systems and enterprise integrations on real business systems.",
  {fixed:[0,0], sub:"AI Product Engineer · Bengaluru"});
addNode("svit","Sai Vidya Inst. of Tech.","core","org","sai vidya institute technology svit college education information science student degree class 2025 bengaluru university vtu","",
  {fixed:[185,-150], sub:"B.E. Information Science · July 2025 · CGPA 8.6/10", full:"Sai Vidya Institute of Technology", bullets:[
  "B.E. in Information Science, graduated July 2025 with a CGPA of 8.6/10. Before that: PCMC at MES Chaithanya PU College, Sirsi (82%).",
  "Where it started: Information Science & Engineering, Bengaluru.",
  "Talked to GPT until I built a small language model of my own, then fine-tuned many more.",
  "Final-year research published at IEEE ICCTDC 2025 with my project mates."]});
addNode("colligence","Colligence Research","core","org","colligence research job work current ai engineer product engineer intern experience production enterprise compound ai startup","",
  {fixed:[-90,-120], sub:"Intern → AI Engineer → AI Product Engineer · Feb 2025 – now", bullets:[
  "Joined Feb 2025 as AI Engineer Intern, converted to full-time AI Engineer, recently promoted to AI Product Engineer.",
  "Agent workflows on Google ADK, LangGraph and LangChain: tool calling, state management, external business systems.",
  "RAG pipelines: document ingestion, embeddings, retrieval, context assembly and grounded response generation.",
  "MCP tools + enterprise APIs: accounting operations, financial-report validation, workflow tracing with LangSmith."]});
addNode("codeorigin","Code Origin","core","org","code origin internship intern backend experience web","",
  {fixed:[130,175], sub:"Backend Developer Intern · Nov 2023 – Jan 2024", bullets:[
  "Developed REST APIs and integrated relational databases to implement backend functionality for web applications.",
  "Implemented server-side business logic and data handling for application features."]});
addNode("p_paper","IEEE Paper","models","project","ieee paper publication cnn retinal images cardiovascular risk heart deep learning medical imaging research icctdc conference densenet","",
  {fixed:[345,-190], sub:"IEEE · ICCTDC 2025 · Hassan, India", full:"Cardiovascular Risk Prediction System Using Retinal Images", bullets:[
  "CNN-based binary classifier that reads blood-vessel structures and anomalies in retinal images.",
  "Predicts cardiovascular risk non-invasively; integrated into a web GUI for healthcare professionals.",
  "Reported 95% accuracy. Co-authored with Anisha Gazi, Sanjana Gopal Hegde, Vineetha Maiya U and Priya Arundhati."]});
addNode("p_agents","Agent Orchestration","agents","project","project enterprise agent orchestration workflow automation agents tools multi step","",
  {fixed:[-340,-30], sub:"Project · Python · Google ADK · LangGraph · LangChain · MCP · LangSmith", full:"Enterprise Agent Orchestration & Workflow Automation", bullets:[
  "Architected modular multi-agent workflows that coordinate multi-step tasks, route work to specialised tools and interact with external business APIs.",
  "Workflow state management, structured outputs, context passing and controlled tool execution.",
  "LangSmith tracing and workflow evaluations to debug tool interactions, inspect failures and improve reliability."]});
addNode("p_erp","ERP Audit Assistant","finance","project","project erp accounting intelligence audit assistant tally flutter finance mcp llm","",
  {fixed:[-120,175], sub:"Project · Flutter · Python · PostgreSQL · Tally XML · MCP · LLMs", full:"AI-Powered ERP Accounting Intelligence & Audit Assistant", bullets:[
  "Flutter app for ledger management, accounting workflows, financial reporting and management insights.",
  "Python connector over Tally's XML interface + MCP tools to retrieve financial data, execute supported operations and extract reports.",
  "Validated Trial Balance, Profit & Loss, Balance Sheet and Ledger reports; AI-assisted accounting queries and audit support."]});
addNode("p_lora","Domain LLM Fine-Tuning","models","project","project domain specific llm fine tuning inference lora peft model training","",
  {fixed:[310,60], sub:"Project · Python · PyTorch · HF Transformers · PEFT/LoRA", full:"Domain-Specific LLM Fine-Tuning & Inference System", bullets:[
  "Prepared domain-specific datasets and fine-tuning workflows to adapt pretrained LMs to specialised business tasks.",
  "Evaluated responses against representative test cases for task accuracy and instruction following.",
  "Integrated inference into application workflows; worked with DevOps on deployment configuration and runtime readiness."]});

addNode("adk","Google ADK","agents","skill","google adk agent development kit agents framework orchestration","Agent framework used at Colligence Research and in the Agent Orchestration project.");
addNode("langgraph","LangGraph","agents","skill","langgraph graph stateful agents orchestration workflow","Stateful agent graphs: workflow state, context passing and controlled tool execution.");
addNode("langchain","LangChain","agents","skill","langchain chains agents tools llm framework","LLM application framework used alongside ADK and LangGraph.");
addNode("toolcall","Tool calling","agents","skill","tool calling function calling tools agents invoke call","Agents that invoke specialised tools and external business APIs.");
addNode("orch","Workflow orchestration","agents","skill","workflow orchestration automation coordination agents automate","Coordinating multi-step tasks across specialised agents and tools.");
addNode("state","State management","agents","skill","state management memory workflow graph","Explicit workflow state so multi-step agents stay predictable and debuggable.");
addNode("structured","Structured outputs","agents","skill","structured outputs json schema reliable parsing","Schema-shaped LLM outputs that downstream business systems can trust.");
addNode("ctxpass","Context passing","agents","skill","context passing handoff agents steps","Passing the right context between agent steps.");
addNode("controlled","Controlled tool execution","agents","skill","controlled tool execution safety guardrails permissions","Tools run under explicit control, which matters when the tools touch accounting data.");
addNode("multiagent","Multi-agent systems","agents","skill","multi agent systems orchestration routing specialised agents","Multi-agent workflows that route work to specialised tools and agents.");
addNode("multistep","Multi-step tasks","agents","skill","multi step tasks planning agents automation","Breaking business processes into coordinated, inspectable agent steps.");
addNode("rag","RAG","retrieval","skill","rag retrieval augmented generation grounded documents knowledge","RAG pipelines at Colligence Research, from document ingestion to grounded response generation.");
addNode("ingest","Document ingestion","retrieval","skill","document ingestion parsing loading documents files","Stage 1 of the RAG pipeline: bringing enterprise documents in.");
addNode("emb","Embeddings","retrieval","skill","embeddings vectors encode semantic representation","Stage 2: turning text into vectors for semantic retrieval.");
addNode("vret","Vector retrieval","retrieval","skill","vector retrieval similarity nearest neighbour search","Stage 3: pulling the most relevant passages. The same idea this page runs on.");
addNode("ctxasm","Context assembly","retrieval","skill","context assembly prompt construction passages","Stage 4: selecting and ordering retrieved passages for the model.");
addNode("grounded","Grounded generation","retrieval","skill","grounded generation hallucination answers sources factual","Stage 5: answers grounded in retrieved context, not model guesses.");
addNode("semsearch","Semantic search","retrieval","skill","semantic search meaning query retrieval","Search by meaning, not just keywords.");
addNode("vdb","Vector databases","retrieval","skill","vector databases store index database","Storage and indexing layer for embeddings.");
addNode("llms","LLMs","models","skill","llms large language models generation llm gpt","The engine under every application on this map.");
addNode("slm","Small LMs","models","skill","small language model slm built from scratch gpt language model training spark","Built a small language model of my own after long conversations with GPT. Then fine-tuned many more.");
addNode("cnn","CNN","models","skill","cnn convolutional neural network deep learning vision image classification densenet","A CNN binary classifier on retinal images, from the IEEE paper.");
addNode("medimg","Medical imaging","models","skill","medical imaging retinal fundus images healthcare diagnosis vision cardiovascular","Retinal (fundus) images as model input for cardiovascular risk prediction.");
addNode("prompt","Prompt engineering","models","skill","prompt engineering prompting instructions","Designing prompts and instructions for reliable task behaviour.");
addNode("ft","Fine-tuning","models","skill","fine tuning finetune adapt training domain","Adapting pretrained language models to specialised business tasks.");
addNode("lora","PEFT / LoRA","models","skill","peft lora adapters parameter efficient fine tuning","Parameter-efficient fine-tuning in the Domain LLM project.");
addNode("torch","PyTorch","models","skill","pytorch deep learning training torch","Training framework behind the fine-tuning workflows.");
addNode("hf","Hugging Face","models","skill","hugging face transformers models hub","Transformers for model loading, training and inference.");
addNode("data","Domain datasets","models","skill","dataset data preparation domain training curation","Domain-specific datasets prepared for fine-tuning.");
addNode("tceval","Test-case evaluation","models","skill","evaluation test cases accuracy instruction following eval benchmark","Responses evaluated on representative test cases for task accuracy and instruction following.");
addNode("deploy","Model deployment","models","skill","deployment inference serving production devops runtime","Inference integrated into application workflows; deployment configuration with DevOps.");
addNode("mcp","MCP","finance","skill","mcp model context protocol tools server integration","Model Context Protocol tools that let LLMs operate enterprise systems, at work and in the ERP project.");
addNode("tally","Tally XML","finance","skill","tally xml erp accounting connector integration","Python connector over Tally's XML interface: retrieve data, run supported operations, extract reports.");
addNode("entapi","Enterprise APIs","finance","skill","enterprise apis business systems integration external","Agents and tools wired into external business APIs.");
addNode("tb","Trial Balance","finance","skill","trial balance accounting report validation finance","Report validated through the Tally connector.");
addNode("pl","Profit & Loss","finance","skill","profit loss p&l accounting report finance","Report validated through the Tally connector.");
addNode("bs","Balance Sheet","finance","skill","balance sheet accounting report finance","Report validated through the Tally connector.");
addNode("ledger","Ledger","finance","skill","ledger accounting management finance books","Ledger management in the Flutter app, plus ledger report validation.");
addNode("audit","Audit support","finance","skill","audit support assistant compliance finance","AI-assisted audit support on top of validated reports.");
addNode("aq","Accounting queries","finance","skill","accounting queries natural language finance questions ask","AI-assisted accounting queries: ask the books in plain language.");
addNode("freport","Financial reporting","finance","skill","financial reporting reports validation management insights finance","Financial reporting, management insights and financial-report validation.");
addNode("python","Python","eng","skill","python programming backend scripting","Primary language across every project.");
addNode("sql","SQL","eng","skill","sql queries relational database","Relational data work since the Code Origin internship.");
addNode("fastapi","FastAPI","eng","skill","fastapi api backend python service","Python services for AI backends.");
addNode("rest","REST APIs","eng","skill","rest apis backend services http api","From the internship onward: REST APIs for web apps and enterprise AI.");
addNode("pg","PostgreSQL","eng","skill","postgresql postgres database relational","Database for the enterprise AI apps and the ERP assistant.");
addNode("mysql","MySQL","eng","skill","mysql database relational","Relational database experience.");
addNode("docker","Docker","eng","skill","docker containers deployment devops","Containerised deployment.");
addNode("git","Git","eng","skill","git version control","Version control.");
addNode("flutter","Flutter","eng","skill","flutter mobile app ui frontend dart interface","Front-end for the ERP accounting app.");
addNode("js","JavaScript","eng","skill","javascript web frontend js","Web development.");
addNode("ts","TypeScript","eng","skill","typescript web frontend types ts","Typed web development.");
addNode("langsmith","LangSmith","obs","skill","langsmith tracing observability evals debugging monitoring","Workflow tracing and evaluation: the debugger for agents.");
addNode("tracing","Tracing","obs","skill","tracing traces spans observability debug monitoring","Every agent step recorded and inspectable.");
addNode("wfeval","Workflow evals","obs","skill","workflow evaluations evals testing reliability eval","Evaluations that catch regressions in multi-step workflows.");
addNode("failure","Failure inspection","obs","skill","failure inspection debugging errors reliability debug","Finding why a tool interaction failed, then fixing it.");

const EDGES_OF = {
  vijay:["colligence","codeorigin","svit","p_agents","p_erp","p_lora","p_paper"],
  svit:["p_paper","slm"],
  colligence:["python","llms","rest","pg","adk","langgraph","langchain","toolcall","state","rag","ingest","emb","vret","ctxasm","grounded","mcp","entapi","freport","langsmith","tracing"],
  codeorigin:["rest","sql"],
  p_paper:["cnn","medimg"],
  p_agents:["multiagent","python","adk","langgraph","langchain","mcp","langsmith","multistep","toolcall","state","structured","ctxpass","controlled","wfeval","failure","entapi","orch","tracing"],
  p_erp:["flutter","python","pg","tally","mcp","llms","tb","pl","bs","ledger","audit","aq","freport"],
  p_lora:["python","torch","hf","lora","ft","data","tceval","deploy","llms"]
};
/* project / org nodes → detail document */
const NODE_DOC = {vijay:"about", svit:"paper", colligence:"coll", codeorigin:"intern", p_agents:"agentsP", p_erp:"erp", p_lora:"lora", p_paper:"paper"};

/* ===== 02 the tour (scroll chapters) ===== */
const CHAPTERS = [
  {k:"agents", title:"Agents that do real work.", focus:"p_agents", doc:"agentsP",
   body:"At Colligence Research I build agent workflows on <b>Google ADK</b>, <b>LangGraph</b> and <b>LangChain</b>: modular agents that plan multi-step tasks, call specialised tools and talk to external business APIs, with explicit state, structured outputs and controlled tool execution.",
   flow:["plan","call tools","update state","structured output"], chips:["adk","langgraph","langchain","toolcall","state","structured"],
   ev:"Project · Enterprise Agent Orchestration & Workflow Automation", say:"Agents: plan, call tools, keep state. My kind of people."},
  {k:"retrieval", title:"Answers grounded in documents.", focus:"rag", doc:"coll",
   body:"I build <b>RAG pipelines</b> end to end, so the model answers from the company's own documents instead of guessing: ingestion, embeddings, vector retrieval, context assembly and grounded response generation.",
   flow:["ingest","embed","retrieve","assemble","ground"], chips:["rag","ingest","emb","vret","ctxasm","grounded"],
   ev:"Experience · Colligence Research, Feb 2025 – now", say:"RAG: answers from documents, not vibes."},
  {k:"finance", title:"LLMs, meet the ledger.", focus:"p_erp", doc:"erp",
   body:"A Python connector over <b>Tally</b>'s XML interface, exposed as <b>MCP</b> tools, lets an LLM retrieve financial data, run supported operations and extract reports. Trial Balance, P&amp;L, Balance Sheet and Ledger reports are validated, with AI-assisted accounting queries and audit support in a Flutter app.",
   flow:["Tally XML","MCP tools","LLM","validate","audit"], chips:["mcp","tally","tb","pl","bs","ledger","audit"],
   ev:"Project · AI-Powered ERP Accounting Intelligence & Audit Assistant", say:"LLMs + Tally via MCP. Accounting can't hallucinate."},
  {k:"models", title:"From a CNN paper to LoRA.", focus:"p_paper", doc:"paper",
   body:"It started with a <b>CNN</b> that predicts cardiovascular risk from retinal images, published at <b>IEEE ICCTDC 2025</b>. Today it's domain datasets and <b>PEFT/LoRA</b> fine-tuning with PyTorch and Hugging Face, evaluated on representative test cases and shipped with DevOps.",
   flow:["retina","CNN","risk","→ LoRA","deploy"], chips:["cnn","medimg","slm","lora","torch","hf"],
   ev:"IEEE paper · Domain-Specific LLM Fine-Tuning & Inference System", say:"Published at IEEE, then fine-tuning LLMs. Range!"},
  {k:"obs", title:"Every step, traced.", focus:"langsmith", doc:"agentsP",
   body:"An agent you can't trace is an agent you can't trust. I use <b>LangSmith</b> tracing and workflow evaluations to debug tool interactions, inspect failures and improve workflow reliability.",
   flow:["run","trace","evaluate","fix"], chips:["langsmith","tracing","wfeval","failure"],
   ev:"Colligence Research · Agent Orchestration project", say:"Everything's traced in LangSmith. Even me."},
  {k:"eng", title:"Built on solid backends.", focus:"python", doc:"intern",
   body:"<b>Python</b>, SQL, FastAPI and REST APIs over PostgreSQL and MySQL, containerised with Docker, with Flutter when the product needs an app. It started at Code Origin, building REST APIs and relational-database backends.",
   flow:["API","database","container","app"], chips:["python","fastapi","rest","pg","docker","flutter"],
   ev:"Experience · Code Origin, Backend Developer Intern, 2023–24", say:"APIs and Postgres: the boring parts that keep agents alive."}
];

/* ===== 03 the journey (a training run) ===== */
const JOURNEY = [
  {id:"ckpt-0", tag:"init", file:"init.pt", date:"Jul 2025 · CGPA 8.6", title:"Information Science student.", org:"Sai Vidya Institute of Technology · Bengaluru", score:.12,
   body:"B.E. in Information Science at Sai Vidya Institute of Technology, Bengaluru: graduated July 2025 with a CGPA of 8.6/10. Where the weights were initialised.",
   tags:["B.E. Information Science","CGPA 8.6/10","Class of 2025"], vis:"term", color:"#cfd6e6",
   term:["$ enroll --college \"Sai Vidya Institute of Technology\"","  branch    Information Science & Engineering","  degree    B.E.","  graduated July 2025","  cgpa      8.6 / 10","✓ weights initialised · curiosity=high"]},
  {id:"ckpt-1", tag:"warm-up", file:"warmup-code-origin.pt", date:"Nov 2023 – Jan 2024", title:"First production code.", org:"Code Origin · Backend Developer Intern", score:.24,
   body:"My first internship: REST APIs, relational databases, server-side business logic and data handling for web applications. Real systems, real users.",
   tags:["REST APIs","SQL","Backend"], vis:"term", color:"#ff6b8b",
   term:["$ curl -X POST /api/v1/resources","HTTP/1.1 201 Created","$ psql -c \"\\dt\"","  relations ok","✓ backend fundamentals: learned"]},
  {id:"ckpt-2", tag:"the spark", file:"spark-slm.pt", date:"During college", title:"Talked to GPT until I built my own model.", org:"Self-driven · language models", score:.42,
   body:"My AI journey started with conversations with GPT. Those turned into building a small language model of my own, and then fine-tuning many more. Enter this checkpoint to train a toy one, right in your browser.",
   tags:["GPT","Small LMs","Fine-tuning"], vis:"slm", color:"#b48cff"},
  {id:"ckpt-3", tag:"IEEE", file:"ieee-icctdc-2025.pt", date:"Jul 2025", title:"Published at IEEE.", org:"ICCTDC 2025 · Hassan, India", score:.6,
   body:"“Cardiovascular Risk Prediction System Using Retinal Images”, written with my project mates. A CNN-based binary classifier reads blood-vessel structures and anomalies in retinal images to predict cardiovascular risk, behind a web GUI for clinicians. Reported accuracy: 95%.",
   tags:["CNN","DenseNet121","Medical imaging","IEEE Xplore"], vis:"cnn", color:"#59d0ff",
   authors:"Anisha Gazi · Sanjana Gopal Hegde · Vijay Vishveshwar Bhat · Vineetha Maiya U · Priya Arundhati",
   venue:"2025 International Conference on Computing Technologies & Data Communication (ICCTDC), 4–5 July 2025, Hassan, India. DOI 10.1109/ICCTDC64446.2025.11158918",
   links:[["Read on IEEE Xplore ↗","paper"],["DOI ↗","doi"]]},
  {id:"ckpt-4", tag:"joined", file:"colligence-intern.pt", date:"Feb 2025", title:"AI Engineer Intern at Colligence.", org:"Colligence Research · Bengaluru", score:.71,
   body:"Joined Colligence Research, a compound AI startup that builds intelligence for business. New domain, steeper learning: agents, MCP and RAG on real business systems.",
   tags:["Agents","MCP","RAG"], vis:"term", color:"#ffb454", links:[["colligence.in ↗","company"]],
   term:["$ onboard --org \"Colligence Research\" --role \"AI Engineer Intern\"","  stack   python · google-adk · langgraph · langchain","  tools   mcp · postgres · langsmith","  domain  real business systems","✓ intern onboarded · Feb 2025"]},
  {id:"ckpt-5", tag:"full-time", file:"ai-engineer.pt", date:"After the internship", title:"Converted to full-time AI Engineer.", org:"Colligence Research", score:.82,
   body:"Converted to full-time. Agent workflows on Google ADK, LangGraph and LangChain; RAG pipelines; MCP + Tally for financial-report validation; LangSmith traces on everything.",
   tags:["Google ADK","LangGraph","Tally + MCP","LangSmith"], vis:"rank", rank:1, color:"#5fe3a1"},
  {id:"ckpt-6", tag:"promoted", file:"ai-product-engineer.pt", date:"Recently", title:"Promoted to AI Product Engineer.", org:"Colligence Research", score:.92,
   body:"Recently promoted to AI Product Engineer: from building agents to shaping the AI products they live in.",
   tags:["AI products","Agents","Enterprise AI"], vis:"rank", rank:2, color:"#7af5ff"},
  {id:"ckpt-7", tag:"next", file:"next.pt", date:"Pending", title:"The next hard problem.", org:"Your team?", score:.98, future:true,
   body:"Training continues. If you're building agentic systems, RAG or enterprise AI products, let's talk.",
   tags:["Open to talk"], vis:"term", color:"#f4efe4",
   term:["$ await vijay.next_checkpoint()","  status   waiting for your message…","  inbox    "+LINKS.email,"→ run `hire` in the console, or scroll to contact"]}
];
const RANKS = ["AI Engineer Intern","AI Engineer","AI Product Engineer"];

/* ===== 04 the detail (attention reader) ===== */
const GROUPS = {me:"About", svit:"SVIT", paper:"IEEE paper", coll:"Colligence", intern:"Code Origin", agentsP:"Agent Orchestration", erp:"ERP Audit Assistant", lora:"Domain LLM"};
const GROUP_DOC = {me:"about", svit:"about", paper:"paper", coll:"coll", intern:"intern", agentsP:"agentsP", erp:"erp", lora:"lora"};
// [aliases (|), semantic tags, groups, chain:order, detail]
const VOCAB = [
  ["Vijay","me","me","","That's me: an AI Product Engineer building business-oriented AI with agents, retrieval and enterprise integrations."],
  ["AI Product Engineer|Product Engineer","me agents enterprise","me coll","career:6","AI Product Engineer at Colligence Research: recently promoted from AI Engineer."],
  ["AI Engineer","me agents models","coll","career:5","Full-time AI Engineer at Colligence Research after the internship."],
  ["engineer","me agents models","me coll","","AI engineering at Colligence Research since Feb 2025."],
  ["Bangalore|Bengaluru","me","me","","Based in Bengaluru, Karnataka."],
  ["Sai Vidya Institute of Technology|SVIT","me","me svit paper","career:0","B.E. Information Science, Sai Vidya Institute of Technology, Bengaluru. Graduated July 2025 with a CGPA of 8.6/10."],
  ["GPT","models agents","me","career:2","Where it started: long conversations with GPT about how language models work."],
  ["small language model|SLM","models training","me","career:3","A small language model of my own, built after those GPT conversations."],
  ["fine-tuned","models training","me lora","career:3","After the first SLM I fine-tuned many more models."],
  ["project mates","me","paper svit","","Co-authors: Anisha Gazi, Sanjana Gopal Hegde, Vineetha Maiya U and Priya Arundhati."],
  ["IEEE","eval vision","paper me","career:4","Published in the 2025 International Conference on Computing Technologies & Data Communication (ICCTDC), on IEEE Xplore."],
  ["ICCTDC 2025","eval me","paper","career:4","International Conference on Computing Technologies & Data Communication, 4–5 July 2025, Hassan, India."],
  ["Hassan","me","paper","","Conference location: Hassan, Karnataka."],
  ["intern","me agents","coll","career:5","Feb 2025: joined Colligence Research as an AI Engineer Intern."],
  ["Colligence|Colligence Research","me enterprise","me coll","career:5","Colligence Research: a compound AI startup in Bengaluru that builds intelligence for business. Feb 2025 – now."],
  ["Code Origin","me backend","me intern","career:1","Backend Developer Intern at Code Origin, Nov 2023 – Jan 2024."],
  ["next hard problem","me","me","career:7","Open to new problems: agentic systems, RAG, enterprise AI products. Say hi."],
  ["Cardiovascular Risk Prediction System Using Retinal Images","vision health","paper","","The paper's full title. DOI 10.1109/ICCTDC64446.2025.11158918."],
  ["CNN","vision models","paper","paper:1","A convolutional neural network: the binary classifier at the heart of the paper."],
  ["DenseNet121","vision models framework","paper","paper:1","DenseNet121, listed among the paper's author keywords."],
  ["binary classifier","vision models eval","paper","paper:2","Two classes in, one decision out: at risk or not."],
  ["retinal images","vision data health","paper","paper:0","Fundus images of the retina: the model's input."],
  ["blood vessel structures","vision health data","paper","paper:0","Retinal vessel patterns the model learns to read."],
  ["anomalies","vision health","paper","paper:0","Abnormalities in the retina associated with cardiovascular risk."],
  ["cardiovascular risk","health","paper","paper:3","The prediction target: risk of cardiovascular disease, such as heart attacks."],
  ["risk prediction","health eval","paper","paper:3","The output a clinician sees after uploading a scan."],
  ["95% accuracy","eval","paper","paper:3","Accuracy reported in the paper's abstract."],
  ["web GUI","app backend","paper","paper:4","A web interface where healthcare professionals upload retinal images."],
  ["healthcare professionals","health","paper","paper:5","The intended users: clinicians screening for early risk."],
  ["non-invasive","health","paper","","No blood test, no procedure: just a photo of the retina."],
  ["agents|agent workflows","agents","coll agentsP","","Modular agent workflows that coordinate multi-step tasks and call external business APIs."],
  ["Google ADK","agents framework","coll agentsP","","Google's Agent Development Kit, one of my main orchestration frameworks."],
  ["LangGraph","agents framework state","coll agentsP","","Stateful agent graphs: workflow state, context passing, controlled tool execution."],
  ["LangChain","agents framework models","coll agentsP","","LLM application framework, used alongside ADK and LangGraph."],
  ["plan","agents","agentsP","agent:0","Agents break a business task into coordinated, inspectable steps."],
  ["multi-step tasks","agents","agentsP","agent:0","Coordinating multi-step business tasks across specialised agents."],
  ["tools|tool calling","agents integration","coll agentsP","agent:1","Tool calling into specialised tools and enterprise APIs."],
  ["controlled execution|controlled tool execution","agents integration eval","agentsP","agent:1","Every tool runs under explicit control, which matters when tools touch business data."],
  ["business APIs|enterprise apis","integration enterprise backend","coll agentsP","agent:1","External business APIs and systems that agents read from and act on."],
  ["state|state management","agents state","coll agentsP","agent:2","Explicit workflow state so multi-step agents stay predictable and debuggable."],
  ["structured|structured outputs","agents state eval","agentsP","agent:2","Structured outputs that downstream business systems can trust."],
  ["context passing","agents state","agentsP","agent:2","Passing the right context between agent steps."],
  ["traces|trace|tracing","obs eval agents","coll agentsP","agent:3","Tracing to debug tool interactions and inspect failures."],
  ["workflow","agents obs","coll agentsP","agent:3","Multi-step workflows, made reliable with traces and evals."],
  ["workflow evals","eval obs","agentsP","agent:4","Workflow evaluations that catch failures in multi-step agent runs."],
  ["LangSmith","obs eval framework","coll agentsP","agent:4","LangSmith: workflow tracing and evaluation. The debugger for agents."],
  ["reliability","eval obs","agentsP","agent:5","The point of all that tracing: agents that work every time, not just in the demo."],
  ["Enterprise Agent Orchestration","agents enterprise","agentsP","","Project: Enterprise Agent Orchestration & Workflow Automation."],
  ["MCP","integration agents finance","coll erp agentsP","erp:2","Model Context Protocol tools that let LLMs operate enterprise systems."],
  ["RAG","retrieval","coll","","Retrieval-augmented generation pipelines, built end to end at Colligence Research."],
  ["ingestion|document ingestion","retrieval data","coll","rag:0","RAG stage 1: document ingestion."],
  ["embeddings","retrieval models","coll","rag:1","RAG stage 2: embeddings for semantic search."],
  ["retrieval|vector retrieval","retrieval","coll","rag:2","RAG stage 3: vector retrieval of the most relevant passages."],
  ["context|context assembly","retrieval state","coll","rag:3","RAG stage 4: context assembly for the model."],
  ["grounded|grounded responses|grounded generation","retrieval eval","coll","rag:4","RAG stage 5: grounded response generation. Answers come from sources."],
  ["LLMs|LLM","models agents retrieval","coll erp","erp:3","The engine under everything, wired into real business systems."],
  ["Tally|tally xml","finance integration","erp","erp:0","Tally ERP, reached through a Python connector over its XML interface."],
  ["XML interface","integration finance backend","erp","erp:1","Tally's XML interface: the protocol the Python connector speaks."],
  ["retrieve financial data","finance integration retrieval","erp","erp:4","An MCP tool capability: pull financial data from Tally."],
  ["execute supported operations","finance integration agents","erp","erp:4","MCP tools that run supported accounting operations."],
  ["extract reports","finance integration data","erp","erp:4","MCP tools that extract reports for validation."],
  ["validated|validate|financial-report validation","finance eval","erp coll","erp:5","Financial-report validation: Trial Balance, P&L, Balance Sheet, Ledger."],
  ["Trial Balance|trial balances","finance","erp","erp:6","Trial Balance reports, validated through the connector."],
  ["Profit & Loss","finance","erp","erp:6","Profit & Loss reports, validated through the connector."],
  ["Balance Sheet|balance sheets","finance","erp","erp:6","Balance Sheet reports, validated through the connector."],
  ["Ledger|ledgers","finance data","erp","erp:6","Ledger reports, validated through the connector."],
  ["AI-assisted queries|accounting queries","finance models agents","erp","erp:7","Ask the books in plain language: AI-assisted accounting queries."],
  ["audit support","finance eval","erp","erp:7","AI-assisted audit support on top of validated reports."],
  ["ERP Audit Assistant","finance enterprise app","erp","","Project: AI-Powered ERP Accounting Intelligence & Audit Assistant."],
  ["Flutter","app backend","erp","","Flutter front-end for the accounting app."],
  ["ledger management","finance app data","erp","","Ledger management in the Flutter app."],
  ["accounting workflows","finance agents","erp","","Accounting workflows inside the app."],
  ["financial reporting","finance data","erp coll","","Financial reporting and report extraction."],
  ["management insights","finance data","erp","","Management insights on top of validated financial data."],
  ["accounting operations","finance agents","coll","","Accounting operations implemented through MCP tools at work."],
  ["PostgreSQL","backend data","coll erp","","PostgreSQL under the enterprise AI apps and the ERP assistant."],
  ["Python","backend","coll erp lora agentsP","","Primary language across every project."],
  ["REST APIs","backend integration","coll intern","","REST APIs, from my internship to enterprise AI backends."],
  ["relational databases|databases","backend data","intern","","Relational databases integrated into web backends."],
  ["backend developer intern","me backend","intern","career:1","My first role: Backend Developer Intern at Code Origin."],
  ["backend functionality","backend","intern","","Backend functionality for web applications."],
  ["web applications","backend app","intern","","The web applications those backends served."],
  ["enterprise AI applications","enterprise models agents","coll","","Enterprise AI applications with Python, LLMs, REST APIs and PostgreSQL."],
  ["fine-tuning|fine-tune","models training","lora","ft:1","Fine-tuning workflows for specialised business tasks."],
  ["PyTorch","models training framework","lora","ft:2","Training framework behind the fine-tuning work."],
  ["Hugging Face Transformers|Hugging Face","models framework","lora","ft:2","Hugging Face Transformers for loading, training and inference."],
  ["PEFT/LoRA|LoRA|peft / lora","models training","lora","ft:2","PEFT/LoRA parameter-efficient fine-tuning."],
  ["evaluated|evaluate","eval models","lora agentsP","ft:3","Responses evaluated for task accuracy and instruction following."],
  ["representative test cases|test cases|test-case evaluation","eval data","lora","ft:3","Representative test cases: the eval set for the fine-tuned model."],
  ["task accuracy","eval","lora","ft:4","Metric one: did the model do the task right?"],
  ["instruction following","eval models","lora","ft:4","Metric two: did it follow the instructions?"],
  ["inference","models backend","lora","ft:5","Model inference integrated into application workflows."],
  ["application workflows","backend agents","lora","ft:5","Where the fine-tuned model actually gets used."],
  ["deployment|deploy|model deployment","backend models","lora","ft:6","Deployment configuration, worked out with DevOps."],
  ["DevOps","backend","lora","ft:6","Collaborated with DevOps teams on deployment and runtime readiness."],
  ["runtime readiness","backend eval","lora","ft:7","Making sure the model is ready to serve in production."],
  ["domain LLM","models training","lora","","Project: Domain-Specific LLM Fine-Tuning & Inference System."],
  ["pretrained model","models","lora","ft:0","The starting point: a pretrained language model."],
  ["specialised business tasks","models enterprise","lora","","The target: specialised business tasks."],
  ["domain datasets","data training","lora","ft:0","Domain-specific datasets prepared for fine-tuning."]
];
const DOCS = [
  {id:"about", name:"The story", kind:"origin → now",
   text:"I'm {Vijay}, an {AI Product Engineer} in {Bengaluru}. It started at {Sai Vidya Institute of Technology}, talking to {GPT} until I built my own {small language model} and {fine-tuned} many more. With my {project mates} I published an {IEEE} paper: a {CNN} that predicts {cardiovascular risk} from {retinal images}. In Feb 2025 I joined {Colligence} Research as an {intern}. Now I build {agents} with {Google ADK}, {LangGraph} and {LangChain}, {RAG} pipelines that stay {grounded}, and {MCP} tools that let {LLMs} {validate} {ledgers} in {Tally}. I {trace} every {workflow} in {LangSmith}. Next: the {next hard problem}."},
  {id:"paper", name:"IEEE paper", kind:"ICCTDC 2025",
   text:"Our {IEEE} paper, {Cardiovascular Risk Prediction System Using Retinal Images}, was presented at {ICCTDC 2025} in {Hassan} with my {project mates} from {SVIT}. A {CNN} {binary classifier} built around {DenseNet121} reads {blood vessel structures} and {anomalies} in {retinal images} to predict {cardiovascular risk}. A {web GUI} lets {healthcare professionals} upload a scan and get a {risk prediction}. It reached {95% accuracy}, and it's {non-invasive}: just a photo of the eye."},
  {id:"agentsP", name:"Agent Orchestration", kind:"project",
   text:"{Enterprise Agent Orchestration} is about {agents} that finish real work. Written in {Python} on {Google ADK}, {LangGraph} and {LangChain}, its modular workflows {plan} {multi-step tasks}, invoke specialised {tools} and call external {business APIs} through {MCP}. {State} is managed explicitly, outputs are {structured}, {context passing} links the steps, and every tool runs under {controlled execution}. When something breaks, {LangSmith} {traces} and {workflow evals} show where, so failures get inspected and {reliability} goes up."},
  {id:"erp", name:"ERP Audit Assistant", kind:"project",
   text:"The {ERP Audit Assistant} pairs a {Flutter} app for {ledger management}, {accounting workflows}, {financial reporting} and {management insights} with a {Python} connector over {Tally}'s {XML interface}. Exposed as {MCP} tools, it lets an {LLM} {retrieve financial data}, {execute supported operations} and {extract reports}. {Trial Balance}, {Profit & Loss}, {Balance Sheet} and {Ledger} reports are {validated}, and {AI-assisted queries} add {audit support} on top, with {PostgreSQL} underneath."},
  {id:"lora", name:"Domain LLM", kind:"project",
   text:"The {domain LLM} project adapts a {pretrained model} to {specialised business tasks}. I prepared {domain datasets} and {fine-tuning} workflows with {PyTorch}, {Hugging Face Transformers} and {PEFT/LoRA}, {evaluated} responses on {representative test cases} for {task accuracy} and {instruction following}, then integrated {inference} into {application workflows} and worked with {DevOps} on {deployment} and {runtime readiness}."},
  {id:"coll", name:"Colligence", kind:"Feb 2025 – now",
   text:"At {Colligence Research} I went from {intern} to {AI Engineer} to {AI Product Engineer}. I develop {enterprise AI applications} with {Python}, {LLMs}, {REST APIs} and {PostgreSQL}; build {agent workflows} on {Google ADK}, {LangGraph} and {LangChain} with {tool calling} and {state management}; build {RAG} pipelines from {document ingestion} and {embeddings} to {retrieval}, {context assembly} and {grounded responses}; and wire {MCP} into {accounting operations} and {financial-report validation}, traced end to end in {LangSmith}."},
  {id:"intern", name:"Code Origin", kind:"2023–24",
   text:"At {Code Origin} (Nov 2023 – Jan 2024) I was a {backend developer intern}. I developed {REST APIs}, integrated {relational databases} and implemented {backend functionality} for {web applications}. Everything I've built since stands on that foundation."}
];
