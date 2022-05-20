export interface DisplayDay {
    day: string;
    number: string; 
    date: Date; 
    past: boolean;
}

export interface DisplayMonth {
    display: string; 
    date: Date;
}

export interface DisplayHeader {
    display: string;
    currentView: string;
}
