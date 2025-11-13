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

    analyzeData(filteredCrashData) {
        let vis = this;

        if (!vis.solutionsData || vis.solutionsData.length === 0) {
            console.warn('No solutions data available');
            return this.getDefaultSuggestions();
        }

        console.log('Analyzing data for improvements:', filteredCrashData.length, 'crash records');

        const analysis = vis.analyzeCrashPatterns(filteredCrashData);

        const suggestions = vis.getRelevantSolutions(analysis);

        console.log('Generated suggestions:', suggestions.length);
        return suggestions;
    }

    analyzeCrashPatterns(filteredData) {
        let vis = this;

        if (filteredData.length === 0) {
            return {
                dominantUserType: 'Driver',
                topActions: [],
                severityBreakdown: {},
                totalCrashes: 0,
                userTypeCounts: { Driver: 0, Pedestrian: 0, Cyclist: 0 }
            };
        }

        const actionCounts = {
            driver: {},
            pedestrian: {},
            cyclist: {}
        };

        let severityCounts = {
            Fatal: 0,
            Major: 0,
            Minor: 0,
            Minimal: 0
        };

        let userTypeCounts = {
            Driver: 0,
            Pedestrian: 0,
            Cyclist: 0
        };

        filteredData.forEach(d => {
            const severity = d.Severity || 'Minimal';
            severityCounts[severity] = (severityCounts[severity] || 0) + 1;

            const driverAction = d.DriverAction || d.driverAction;
            const pedestrianAction = d.PedestrianAction || d.pedestrianAction;
            const cyclistAction = d.CyclistAction || d.cyclistAction;

            if (driverAction && driverAction !== '' && driverAction !== 'Unknown') {
                actionCounts.driver[driverAction] = (actionCounts.driver[driverAction] || 0) + 1;
                userTypeCounts.Driver++;
            }
            if (pedestrianAction && pedestrianAction !== '' && pedestrianAction !== 'Unknown') {
                actionCounts.pedestrian[pedestrianAction] = (actionCounts.pedestrian[pedestrianAction] || 0) + 1;
                userTypeCounts.Pedestrian++;
            }
            if (cyclistAction && cyclistAction !== '' && cyclistAction !== 'Unknown') {
                actionCounts.cyclist[cyclistAction] = (actionCounts.cyclist[cyclistAction] || 0) + 1;
                userTypeCounts.Cyclist++;
            }
        });

        const dominantUserType = Object.keys(userTypeCounts).reduce((a, b) =>
            userTypeCounts[a] > userTypeCounts[b] ? a : b
        );

        const topDriverActions = Object.entries(actionCounts.driver)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([action]) => action);

        const topPedestrianActions = Object.entries(actionCounts.pedestrian)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([action]) => action);

        const topCyclistActions = Object.entries(actionCounts.cyclist)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([action]) => action);

        console.log('Analysis results:', {
            userTypeCounts,
            dominantUserType,
            totalCrashes: filteredData.length
        });

        return {
            dominantUserType,
            topDriverActions,
            topPedestrianActions,
            topCyclistActions,
            severityBreakdown: severityCounts,
            totalCrashes: filteredData.length,
            userTypeCounts
        };
    }

    getRelevantSolutions(analysis) {
        let vis = this;

        const suggestions = [];
        const totalCrashes = analysis.totalCrashes;

        if (totalCrashes === 0) {
            return this.getDefaultSuggestions();
        }

        const userTypesWithData = Object.entries(analysis.userTypeCounts)
            .filter(([type, count]) => count > 0)
            .map(([type]) => type);

        console.log('User types with data:', userTypesWithData);
        console.log('User type counts:', analysis.userTypeCounts);

        userTypesWithData.forEach(userType => {
            const relevantSolutions = vis.filterSolutionsByUserType(userType);
            console.log(`Found ${relevantSolutions.length} solutions for ${userType}`);

            const solutionGroups = this.groupSolutionsByType(relevantSolutions);

            Object.keys(solutionGroups).forEach(solutionType => {
                const solutions = solutionGroups[solutionType];
                if (solutions.length > 0) {
                    const suggestion = vis.createSuggestionFromSolutions(
                        solutions,
                        solutionType,
                        userType,
                        analysis
                    );
                    if (suggestion) {
                        suggestions.push(suggestion);
                    }
                }
            });
        });

        const sortedSuggestions = suggestions
            .sort((a, b) => {
                const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
                return priorityOrder[b.priorityLevel] - priorityOrder[a.priorityLevel];
            })
            .slice(0, 5);

        console.log('Final sorted suggestions:', sortedSuggestions);
        return sortedSuggestions;
    }

    filterSolutionsByUserType(userType) {
        let vis = this;

        const filtered = vis.solutionsData.filter(solution => {
            const primaryBeneficiary = (solution['Primary Beneficiary'] || '').toLowerCase();
            const initiativeName = (solution['Initiative Name'] || '').toLowerCase();

            switch(userType.toLowerCase()) {
                case 'driver':
                    return primaryBeneficiary.includes('driver') ||
                        initiativeName.includes('driver') ||
                        initiativeName.includes('speed') ||
                        initiativeName.includes('intersection') ||
                        initiativeName.includes('vehicle');

                case 'pedestrian':
                    return primaryBeneficiary.includes('pedestrian') ||
                        initiativeName.includes('pedestrian') ||
                        initiativeName.includes('crossing') ||
                        initiativeName.includes('walk');

                case 'cyclist':
                    return primaryBeneficiary.includes('cyclist') ||
                        initiativeName.includes('cyclist') ||
                        initiativeName.includes('bicycle') ||
                        initiativeName.includes('bike') ||
                        initiativeName.includes('cycle');

                default:
                    return true;
            }
        });

        console.log(`Filtered ${filtered.length} solutions for ${userType}`);
        return filtered;
    }

    groupSolutionsByType(solutions) {
        const groups = {};

        solutions.forEach(solution => {
            const solutionType = solution['Type'] || 'General';
            if (!groups[solutionType]) {
                groups[solutionType] = [];
            }
            groups[solutionType].push(solution);
        });

        return groups;
    }

    createSuggestionFromSolutions(solutions, solutionType, userType, analysis) {
        let vis = this;

        const primarySolution = solutions[0];
        const totalCrashes = analysis.totalCrashes;

        const userTypeCrashes = analysis.userTypeCounts[userType] || 0;
        const crashesBenefited = Math.round(userTypeCrashes * this.getEffectivenessFactor(solutionType));

        const severeCrashes = (analysis.severityBreakdown.Fatal || 0) + (analysis.severityBreakdown.Major || 0);

        let priorityLevel = 'Medium';
        if (severeCrashes > 10 || userTypeCrashes > 30) priorityLevel = 'High';
        if (userTypeCrashes < 5) priorityLevel = 'Low';

        let actionsTargeted = [];
        if (userType === 'Driver') {
            actionsTargeted = analysis.topDriverActions;
        } else if (userType === 'Pedestrian') {
            actionsTargeted = analysis.topPedestrianActions;
        } else if (userType === 'Cyclist') {
            actionsTargeted = analysis.topCyclistActions;
        }

        const specificSolutions = solutions.slice(0, 3).map(sol => ({
            name: sol['Initiative Name'],
            type: sol['Type'],
            beneficiary: sol['Primary Beneficiary'],
            riskGroups: sol['Risk Group(s)'],
            contributingFactors: sol['Contributing Factor(s)'],
            interventions: sol['Road Safety Interventions']
        }));

        return {
            title: this.getSuggestionTitle(solutionType, userType),
            improvementType: solutionType,
            description: this.getSuggestionDescription(solutionType, userType, actionsTargeted, userTypeCrashes),
            icon: this.getSuggestionIcon(solutionType),
            crashesBenefited: crashesBenefited,
            severityImpact: severeCrashes,
            actionsTargeted: actionsTargeted,
            priorityLevel: priorityLevel,
            effectiveness: this.getEffectivenessRating(solutionType),
            cost: this.getCostRating(solutionType),
            implementation: this.getTimeline(solutionType),
            specificSolutions: specificSolutions,
            userType: userType,
            userTypeCrashes: userTypeCrashes
        };
    }

    getSuggestionTitle(solutionType, userType) {
        const titles = {
            'Road Infrastructure': `${userType} Infrastructure Improvements`,
            'Road Users': `${userType} Behavior & Education`,
            'Policy': `${userType} Safety Policies`,
            'Technology': `Smart ${userType} Safety Solutions`,
            'Education': `${userType} Safety Education`,
            'Communication': `${userType} Safety Awareness`,
            'General': `${userType} Safety Measures`
        };

        return titles[solutionType] || `${userType} Safety Measures`;
    }

    getSuggestionDescription(solutionType, userType, actions, userTypeCrashes) {
        const actionText = actions.length > 0 ?
            `Targeting common ${userType.toLowerCase()} behaviors like ${actions.slice(0, 2).join(', ')}` :
            `Addressing ${userType.toLowerCase()} safety concerns`;

        return `This ${solutionType.toLowerCase()} intervention focuses on improving safety for ${userType.toLowerCase()}s. ${actionText}. Based on ${userTypeCrashes} ${userType.toLowerCase()}-related accidents.`;
    }

    getSuggestionIcon(solutionType) {
        const icons = {
            'Road Infrastructure': '🏗️',
            'Road Users': '🚶',
            'Policy': '📋',
            'Technology': '🔧',
            'Education': '📚',
            'Communication': '📢',
            'General': '✅'
        };
        return icons[solutionType] || '✅';
    }

    getEffectivenessFactor(solutionType) {
        const factors = {
            'Road Infrastructure': 0.7,
            'Road Users': 0.5,
            'Policy': 0.6,
            'Technology': 0.8,
            'Education': 0.4,
            'Communication': 0.3,
            'General': 0.5
        };
        return factors[solutionType] || 0.5;
    }

    getEffectivenessRating(solutionType) {
        const ratings = {
            'Road Infrastructure': 'High',
            'Technology': 'High',
            'Policy': 'Medium-High',
            'Road Users': 'Medium',
            'Education': 'Medium',
            'Communication': 'Low-Medium',
            'General': 'Medium'
        };
        return ratings[solutionType] || 'Medium';
    }

    getCostRating(solutionType) {
        const costs = {
            'Road Infrastructure': 'High',
            'Technology': 'Medium-High',
            'Policy': 'Low',
            'Road Users': 'Low-Medium',
            'Education': 'Low',
            'Communication': 'Low',
            'General': 'Medium'
        };
        return costs[solutionType] || 'Medium';
    }

    getTimeline(solutionType) {
        const timelines = {
            'Road Infrastructure': '6-12 months',
            'Technology': '3-6 months',
            'Policy': '1-3 months',
            'Road Users': '1-2 months',
            'Education': '1-3 months',
            'Communication': '1-2 months',
            'General': '3-6 months'
        };
        return timelines[solutionType] || '3-6 months';
    }

    getDefaultSuggestions() {
        return [
            {
                title: "General Road Safety Assessment",
                improvementType: "Comprehensive Review",
                description: "Conduct a comprehensive road safety assessment to identify key improvement areas.",
                icon: "📊",
                crashesBenefited: 0,
                severityImpact: 0,
                actionsTargeted: ['All observed actions'],
                priorityLevel: 'Medium',
                effectiveness: 'High',
                cost: 'Medium',
                implementation: '2-4 months',
                specificSolutions: [],
                userType: 'General'
            }
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