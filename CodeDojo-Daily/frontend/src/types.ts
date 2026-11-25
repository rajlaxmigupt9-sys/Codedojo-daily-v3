export type TestCase={input:any;expected:any};
export type Problem={id:number;title:string;slug:string;difficulty:'Easy'|'Medium'|'Hard';tags:string[];acceptance:string;time:string;statement:string;examples:{input:string;output:string;explanation:string}[];constraints:string[];functionName:string;tests:TestCase[];hints:string[];points:number};
export type Team={id:string;name:string;avatar:string;members:string[];solves?:number;points?:number;score?:number;streakBonus?:number};
