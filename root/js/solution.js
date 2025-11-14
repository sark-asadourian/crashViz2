class ImprovementSuggestions {
    constructor(crashData, solutionsData = null) {
        let vis = this;
        vis.crashData = crashData;

        vis.solutionsData = solutionsData || vis.getDefaultSolutionsData();

        console.log('Solutions data loaded:', vis.solutionsData.length, 'solutions');
    }

    getDefaultSolutionsData() {
        return [
            // Driver Solutions
            { "Primary Beneficiary": "Driver", "Initiative Name": "Automated speed enforcement", "Type": "Technology", "Risk Group(s)": "High-risk Drivers", "Contributing Factor(s)": "Speed", "Road Safety Interventions": "Enforcement, Technology" },
            { "Primary Beneficiary": "Driver", "Initiative Name": "Intersection safety improvements", "Type": "Road Infrastructure", "Risk Group(s)": "General Population", "Contributing Factor(s)": "Speed, Road Infrastructure", "Road Safety Interventions": "Road Infrastructure" },
            { "Primary Beneficiary": "Driver", "Initiative Name": "Roundabouts", "Type": "Road Infrastructure", "Risk Group(s)": "General Population", "Contributing Factor(s)": "Speed, Road Infrastructure", "Road Safety Interventions": "Road Infrastructure" },
            { "Primary Beneficiary": "Driver", "Initiative Name": "Driver distraction legislation", "Type": "Policy", "Risk Group(s)": "General Population", "Contributing Factor(s)": "Distraction", "Road Safety Interventions": "Policy" },
            { "Primary Beneficiary": "Driver", "Initiative Name": "Graduated driver licensing", "Type": "Policy", "Risk Group(s)": "Young/Novice Drivers", "Contributing Factor(s)": "Distraction, Speed", "Road Safety Interventions": "Policy" },
            { "Primary Beneficiary": "Driver", "Initiative Name": "Rumble Strips", "Type": "Road Infrastructure", "Risk Group(s)": "General Population", "Contributing Factor(s)": "Distraction, Fatigue", "Road Safety Interventions": "Road Infrastructure" },
            { "Primary Beneficiary": "Driver", "Initiative Name": "Variable speed limits", "Type": "Technology", "Risk Group(s)": "Commercial Drivers", "Contributing Factor(s)": "Speed, Environmental Factors", "Road Safety Interventions": "Technology" },
            { "Primary Beneficiary": "Driver", "Initiative Name": "Winter road maintenance", "Type": "Road Infrastructure", "Risk Group(s)": "General Population", "Contributing Factor(s)": "Environmental Factors", "Road Safety Interventions": "Road Infrastructure, Technology" },

            // Pedestrian Solutions
            { "Primary Beneficiary": "Pedestrian", "Initiative Name": "Accessible pedestrian signals", "Type": "Road Infrastructure", "Risk Group(s)": "Vulnerable Road Users", "Contributing Factor(s)": "Road Infrastructure", "Road Safety Interventions": "Road Infrastructure, Technology" },
            { "Primary Beneficiary": "Pedestrian", "Initiative Name": "Leading pedestrian intervals", "Type": "Road Infrastructure", "Risk Group(s)": "Vulnerable Road Users", "Contributing Factor(s)": "Speed, Road Infrastructure", "Road Safety Interventions": "Road Infrastructure" },
            { "Primary Beneficiary": "Pedestrian", "Initiative Name": "Medians and pedestrian crossing islands", "Type": "Road Infrastructure", "Risk Group(s)": "Vulnerable Road Users", "Contributing Factor(s)": "Speed, Road Infrastructure", "Road Safety Interventions": "Road Infrastructure" },
            { "Primary Beneficiary": "Pedestrian", "Initiative Name": "Pedestrian countdown signals", "Type": "Road Infrastructure", "Risk Group(s)": "Vulnerable Road Users", "Contributing Factor(s)": "Road Infrastructure", "Road Safety Interventions": "Road Infrastructure" },
            { "Primary Beneficiary": "Pedestrian", "Initiative Name": "Crosswalk Design Improvements", "Type": "Road Infrastructure", "Risk Group(s)": "Vulnerable Road Users", "Contributing Factor(s)": "Road Infrastructure", "Road Safety Interventions": "Road Infrastructure, Technology" },
            { "Primary Beneficiary": "Pedestrian", "Initiative Name": "School zone safety improvements", "Type": "Road Infrastructure", "Risk Group(s)": "Vulnerable Road Users", "Contributing Factor(s)": "Speed, Road Infrastructure", "Road Safety Interventions": "Communication, Policy" },
            { "Primary Beneficiary": "Pedestrian", "Initiative Name": "Pedestrian safety education", "Type": "Education", "Risk Group(s)": "Vulnerable Road Users", "Contributing Factor(s)": "Environmental Factors", "Road Safety Interventions": "Education, Communication" },
            { "Primary Beneficiary": "Pedestrian", "Initiative Name": "Driver education on pedestrian visibility", "Type": "Education", "Risk Group(s)": "General Population", "Contributing Factor(s)": "Speed, Environmental Factors", "Road Safety Interventions": "Education, Communication" },

            // Cyclist Solutions
            { "Primary Beneficiary": "Cyclist", "Initiative Name": "Separated Bicycle Lanes", "Type": "Road Infrastructure", "Risk Group(s)": "Vulnerable Road Users", "Contributing Factor(s)": "Speed, Road Infrastructure", "Road Safety Interventions": "Road Infrastructure" },
            { "Primary Beneficiary": "Cyclist", "Initiative Name": "Protected intersection design", "Type": "Road Infrastructure", "Risk Group(s)": "Vulnerable Road Users", "Contributing Factor(s)": "Speed, Road Infrastructure", "Road Safety Interventions": "Road Infrastructure" },
            { "Primary Beneficiary": "Cyclist", "Initiative Name": "Bicycle Box intersections", "Type": "Road Infrastructure", "Risk Group(s)": "Vulnerable Road Users", "Contributing Factor(s)": "Speed, Road Infrastructure", "Road Safety Interventions": "Road Infrastructure" },
            { "Primary Beneficiary": "Cyclist", "Initiative Name": "Bike signal timing optimization", "Type": "Road Infrastructure", "Risk Group(s)": "Vulnerable Road Users", "Contributing Factor(s)": "Road Infrastructure", "Road Safety Interventions": "Road Infrastructure, Technology" },
            { "Primary Beneficiary": "Cyclist", "Initiative Name": "Bicycle safety education programs", "Type": "Education", "Risk Group(s)": "Vulnerable Road Users", "Contributing Factor(s)": "Environmental Factors", "Road Safety Interventions": "Education, Communication" },
            { "Primary Beneficiary": "Cyclist", "Initiative Name": "Driver education on cyclist awareness", "Type": "Education", "Risk Group(s)": "General Population", "Contributing Factor(s)": "Environmental Factors", "Road Safety Interventions": "Education, Communication" },
            { "Primary Beneficiary": "Cyclist", "Initiative Name": "Bike lane maintenance and snow clearing", "Type": "Road Infrastructure", "Risk Group(s)": "Vulnerable Road Users", "Contributing Factor(s)": "Environmental Factors", "Road Safety Interventions": "Road Infrastructure, Technology" }
        ];
    }

    matchSolutionToAction(solution, actionType, specificAction) {
        const initiative = (solution['Initiative Name'] || '').toLowerCase();
        const factors = (solution['Contributing Factor(s)'] || '').toLowerCase();
        const actionLower = (specificAction || '').toLowerCase();

        let score = 0;

        const beneficiary = (solution['Primary Beneficiary'] || '').toLowerCase();
        if (beneficiary.includes(actionType.toLowerCase())) {
            score += 3;
        }

        const keywordPatterns = {
            'speed': ['speed', 'velocity', 'fast', 'racing'],
            'distraction': ['distract', 'phone', 'mobile', 'texting'],
            'alcohol': ['alcohol', 'drink', 'dui', 'impaired'],
            'intersection': ['intersection', 'turn', 'cross', 'signal'],
            'pedestrian': ['pedestrian', 'walk', 'crosswalk', 'crossing'],
            'cyclist': ['cyclist', 'bicycle', 'bike', 'cycle'],
            'darkness': ['dark', 'night', 'lighting', 'visibility']
        };

        Object.entries(keywordPatterns).forEach(([category, keywords]) => {
            if (keywords.some(keyword => actionLower.includes(keyword))) {
                if (keywords.some(keyword => initiative.includes(keyword) || factors.includes(keyword))) {
                    score += 2;
                }
            }
        });

        return score;
    }
}