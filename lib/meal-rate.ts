export type MealRate={date:string;cents:number};
export function mealRateOn(date:string,rates:MealRate[]):number|null{
 let selected:MealRate|undefined;
 for(const rate of rates)if(rate.date<=date&&(!selected||rate.date>selected.date))selected=rate;
 return selected?.cents??null;
}
