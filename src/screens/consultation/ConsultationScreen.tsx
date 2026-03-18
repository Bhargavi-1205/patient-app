import React from 'react';
import MyDoctorsScreen from '../doctors/MyDoctorsScreen';

export default function ConsultationScreen({ navigation }: any) {
    return (
        <MyDoctorsScreen
            navigation={navigation}
            showBackButton={false}
            showCount={false}
        />
    );
}
